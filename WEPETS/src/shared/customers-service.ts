// Import D1Database type from @cloudflare/workers-types
declare global {
    interface D1Database {
      prepare(query: string): D1PreparedStatement;
    }
  
    interface D1PreparedStatement {
      bind(...values: any[]): D1PreparedStatement;
      first(): Promise<any>;
      run(): Promise<D1Result>;
      all(): Promise<D1Result>;
    }
  
    interface D1Result {
      success: boolean;
      meta: {
        last_row_id?: number;
        changes?: number;
        duration?: number;
      };
      results?: any[];
    }
  }
  
  // Customer data interfaces
  export interface Customer {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    email_verified: boolean;
    email_consent: boolean;
    phone?: string;
    address?: string;
    source: string;
    metadata?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface SaveCustomerInput {
    formData: Record<string, any>;
    source: string;
  }
  
  export interface SaveCustomerResult {
    success: boolean;
    customer?: Customer;
    error?: string;
  }
  
  // Known customer fields that map to database columns
  const CUSTOMER_FIELDS = new Set([
    "first_name",
    "firstName",
    "last_name",
    "lastName",
    "email",
    "email_verified",
    "emailVerified",
    "email_consent",
    "emailConsent",
    "phone",
    "address",
  ]);
  
  /**
   * Extract customer fields from form data and normalize field names
   */
  function extractCustomerFields(formData: Record<string, any>): {
    customerData: Partial<Customer>;
    metadata: Record<string, any>;
  } {
    const customerData: Partial<Customer> = {};
    const metadata: Record<string, any> = {};
  
    for (const [key, value] of Object.entries(formData)) {
      if (CUSTOMER_FIELDS.has(key)) {
        // Normalize field names to database column names
        switch (key) {
          case "firstName":
            customerData.first_name = value;
            break;
          case "lastName":
            customerData.last_name = value;
            break;
          case "emailVerified":
            customerData.email_verified = Boolean(value);
            break;
          case "emailConsent":
            customerData.email_consent = Boolean(value);
            break;
          default:
            (customerData as any)[key] = value;
        }
      } else {
        // Store other fields in metadata
        metadata[key] = normalizeFormData(value);
      }
    }
  
    return { customerData, metadata };
  }
  
  /**
   * Normalize form data for storage in metadata JSON field
   */
  function normalizeFormData(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
  
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }
  
    if (Array.isArray(value)) {
      return value.map(normalizeFormData);
    }
  
    if (typeof value === "object") {
      const normalized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        normalized[key] = normalizeFormData(val);
      }
      return normalized;
    }
  
    return String(value);
  }
  
  /**
   * Save customer data with upsert logic
   * If customer with same email+source exists, update their data
   * Otherwise, create a new customer record
   */
  async function saveCustomer(
    db: D1Database,
    input: SaveCustomerInput
  ): Promise<SaveCustomerResult> {
    try {
      const { formData, source } = input;
      const { customerData, metadata } = extractCustomerFields(formData);
  
      // Validate required fields
      if (!customerData.email) {
        return {
          success: false,
          error: "Email is required",
        };
      }
  
      // Set defaults for required boolean fields
      customerData.email_verified = customerData.email_verified ?? false;
      customerData.email_consent = customerData.email_consent ?? true; // true by default because we want to send emails to customers by default
  
      // Check if customer exists with same email and source
      const existingCustomer = await db
        .prepare("SELECT * FROM customers WHERE email = ? AND source = ?")
        .bind(customerData.email, source)
        .first();
  
      let result: D1Result;
      const now = new Date().toISOString();
  
      if (existingCustomer) {
        // Update existing customer
        const updateFields: string[] = [];
        const updateValues: any[] = [];
  
        // Build dynamic update query based on provided fields
        if (customerData.first_name !== undefined) {
          updateFields.push("first_name = ?");
          updateValues.push(customerData.first_name);
        }
        if (customerData.last_name !== undefined) {
          updateFields.push("last_name = ?");
          updateValues.push(customerData.last_name);
        }
        if (customerData.email_verified !== undefined) {
          updateFields.push("email_verified = ?");
          updateValues.push(customerData.email_verified);
        }
        if (customerData.email_consent !== undefined) {
          updateFields.push("email_consent = ?");
          updateValues.push(customerData.email_consent);
        }
        if (customerData.phone !== undefined) {
          updateFields.push("phone = ?");
          updateValues.push(customerData.phone);
        }
        if (customerData.address !== undefined) {
          updateFields.push("address = ?");
          updateValues.push(customerData.address);
        }
  
        // Merge metadata with existing metadata
        const existingMetadata = existingCustomer.metadata
          ? JSON.parse(existingCustomer.metadata)
          : {};
        const mergedMetadata = { ...existingMetadata, ...metadata };
  
        updateFields.push("metadata = ?", "updated_at = ?");
        updateValues.push(JSON.stringify(mergedMetadata), now);
  
        // Add WHERE clause values
        updateValues.push(existingCustomer.id);
  
        if (updateFields.length > 2) {
          // More than just metadata and updated_at
          const updateQuery = `
            UPDATE customers
            SET ${updateFields.join(", ")}
            WHERE id = ?
          `;
  
          result = await db
            .prepare(updateQuery)
            .bind(...updateValues)
            .run();
        }
  
        // Fetch updated customer
        const updatedCustomer = await db
          .prepare("SELECT * FROM customers WHERE id = ?")
          .bind(existingCustomer.id)
          .first();
  
        return {
          success: true,
          customer: {
            ...updatedCustomer,
            metadata: updatedCustomer.metadata
              ? JSON.parse(updatedCustomer.metadata)
              : {},
          },
        };
      } else {
        // Insert new customer
        result = await db
          .prepare(
            `
            INSERT INTO customers (
              first_name, last_name, email, email_verified, email_consent,
              phone, address, source, metadata, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          )
          .bind(
            customerData.first_name || "",
            customerData.last_name || "",
            customerData.email,
            customerData.email_verified,
            customerData.email_consent,
            customerData.phone || null,
            customerData.address || null,
            source,
            JSON.stringify(metadata),
            now,
            now
          )
          .run();
  
        // Fetch created customer
        const createdCustomer = await db
          .prepare("SELECT * FROM customers WHERE id = ?")
          .bind(result.meta.last_row_id)
          .first();
  
        return {
          success: true,
          customer: {
            ...createdCustomer,
            metadata: createdCustomer.metadata
              ? JSON.parse(createdCustomer.metadata)
              : {},
          },
        };
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
  
  /**
   * Get customer by email and source
   */
  async function getCustomer(
    db: D1Database,
    email: string,
    source: string
  ): Promise<Customer | null> {
    try {
      const customer = await db
        .prepare("SELECT * FROM customers WHERE email = ? AND source = ?")
        .bind(email, source)
        .first();
  
      if (!customer) {
        return null;
      }
  
      return {
        ...customer,
        metadata: customer.metadata ? JSON.parse(customer.metadata) : {},
      };
    } catch (error) {
      console.error("Error getting customer:", error);
      return null;
    }
  }
  
  // Export as a service object
  export const CustomerService = {
    save: saveCustomer,
    get: getCustomer,
  };
  