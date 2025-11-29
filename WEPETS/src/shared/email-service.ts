/**
 * Email Service for sending form submission emails
 * AI Should NOT modify this file.
 */

interface IJsonSchema {
    $schema: string;
    $id: string;
    type: string;
    title: string;
    description: string;
    required: string[];
    properties: {
      [key: string]: {
        type: string;
        title: string;
        description: string;
        [key: string]: any;
      };
    };
  }
  interface EmailConfig {
    dbSchemaName: string;
    sendNotificationEmail: boolean;
    // Notification Email has fixed styles. So no subject, template for it.
    sendFeedbackEmail: boolean;
    emailSubject: string;
    emailTemplate: string;
    replyToEmail: string;
    jsonSchema: IJsonSchema;
  }
  
  interface EmailPayload {
    senderName?: string; // Optional sender name, suffix will ALWAYS be heyboss.live
    receivers: string;
    title: string;
    body_html: string;
    project_id: string;
    reply_to?: string;
  }
  
  /**
   * Replace template variables with actual form data values
   * Supports {{fieldName}} syntax for variable replacement
   */
  function replaceTemplateVariables(
    template: string,
    formData: Record<string, any>
  ): string {
    let result = template;
  
    // Replace all {{fieldName}} occurrences with actual values
    Object.keys(formData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      const value = formData[key] || "";
      result = result.replace(regex, String(value));
    });
  
    // Add submission timestamp
    result = result.replace(/{{timestamp}}/g, new Date().toISOString());
    result = result.replace(/{{date}}/g, new Date().toLocaleDateString());
    result = result.replace(/{{time}}/g, new Date().toLocaleTimeString());
  
    return result;
  }
  
  /**
   * Generate HTML for form submission notification email
   */
  function generateNotificationEmailHtml(
    formId: string,
    formData: Record<string, any>
  ): string {
    const fields = Object.entries(formData)
      .map(
        ([key, value]) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
        </tr>
      `
      )
      .join("");
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Form Submission</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
             NEW FORM SUBMISSION NOTIFICATION
          </h1>
  
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Form ID:</strong> ${formId}</p>
            <p style="margin: 5px 0 0 0;"><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
          </div>
  
          <h2 style="color: #1f2937; margin-top: 30px;">Submission Details:</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            ${fields}
          </table>
  
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>This is an automated notification from your form submission system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Send email using HeyBoss API
   */
  export async function sendEmail(
    payload: EmailPayload,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("https://api.heybossai.com/v1/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "aws/send-email",
          inputs: {
            ...payload,
            sender: payload.senderName
              ? `${payload.senderName}@heyboss.live`
              : undefined,
          },
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Email API request failed:", response.status, errorText);
        return {
          success: false,
          error: `API request failed: ${response.status}`,
        };
      }
  
      const result = (await response.json()) as {
        send_email_status?: string;
        error?: any;
      };
  
      if (result.send_email_status === "success") {
        return { success: true };
      } else {
        console.error("Failed to send email via API:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Exception when sending email:", error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * Universal callback for form submissions
   * Sends both notification and reply emails based on configuration
   */
  export async function handleFormSubmissionEmails(
    formId: string,
    formData: Record<string, any>,
    emailConfig: EmailConfig,
    env: {
      API_KEY: string;
      PROJECT_ID: string;
      USER_EMAIL: string;
    }
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    let success = true;
  
    // 1. Send notification email to user (admin)
    const sendNotificationEmail = emailConfig.sendNotificationEmail || false;
    if (sendNotificationEmail && env.USER_EMAIL) {
      const notificationResult = await sendEmail(
        {
          receivers: env.USER_EMAIL || "",
          title: `${env.PROJECT_ID} - NEW FORM SUBMISSION - ${formId}`,
          body_html: generateNotificationEmailHtml(formId, formData),
          project_id: env.PROJECT_ID,
        },
        env.API_KEY
      );
  
      if (!notificationResult.success) {
        errors.push(
          `Failed to send notification email: ${notificationResult.error}`
        );
        success = false;
      }
    }
  
    // 2. Send reply email to submitter if configured
    if (emailConfig.sendFeedbackEmail) {
      const submitterEmail = formData["email"];
  
      if (submitterEmail) {
        // Replace template variables with actual values
        const processedTemplate = replaceTemplateVariables(
          emailConfig.emailTemplate,
          formData
        );
  
        const replyResult = await sendEmail(
          {
            senderName: env.USER_EMAIL.split("@")[0],
            receivers: submitterEmail,
            title: emailConfig.emailSubject,
            body_html: processedTemplate,
            project_id: env.PROJECT_ID,
            reply_to: emailConfig.replyToEmail,
          },
          env.API_KEY
        );
  
        if (!replyResult.success) {
          errors.push(`Failed to send reply email: ${replyResult.error}`);
          success = false;
        }
      } else {
        errors.push("No email address found in form data for reply email");
        success = false;
      }
    }
  
    return { success, errors };
  }
  
  export type { EmailConfig, EmailPayload };
  