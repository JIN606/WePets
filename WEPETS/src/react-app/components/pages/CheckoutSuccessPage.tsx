import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { trackPurchase } from "../utils/analytics";

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    // Logic: do not modify dependency array or error-setting behavior here
    if (!sessionId) {
      setError({ message: "Missing sessionId parameter" });
      setLoading(false);
      return;
    }

    fetchPurchaseDetail(sessionId);
  }, [sessionId]);

  // Logic: network call and response handling — DO NOT modify URL, method,
  // headers, or success/error branching. UI-only changes belong in the JSX below.
  const fetchPurchaseDetail = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/products/purchase-detail?sessionId=${sessionId}`,
        {
          method: "GET",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setPurchaseData(result);
        setError(null);
        trackPurchase({
          orderId: result.checkoutSessionId,
          value: result.totalAmount,
          currency: result.currency,
          items: result.products.map((product: any) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
          })),
        });
      } else {
        setError(result);
      }
    } catch (err) {
      setError({ message: "Network error, please try again later" });
      console.error("Error fetching purchase detail:", err);
    } finally {
      setLoading(false);
    }
  };

  // UI-only region starts below. You may:
  // - Adjust classNames, layout containers, spacing, colors, typography
  // - Tweak text content and non-functional attributes
  // Do NOT:
  // - Change which branches render (loading/error/!purchaseData/success)
  // - Introduce new conditions that alter logic
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
        {loading ? (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying purchase information...</p>
          </div>
        ) : error ? (
          <>
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Purchase Failed
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{`Failed to get purchase information: ${error?.message}`}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Verification
            </button>
          </>
        ) : !purchaseData ? (
          <>
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Purchase Information Not Found
            </h1>
            <p className="text-gray-600">
              Please check if the sessionId is correct
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Purchase Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase, your order has been confirmed
            </p>

            {purchaseData.products && purchaseData.products.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    Your Order ({purchaseData.products.length} item
                    {purchaseData.products.length > 1 ? "s" : ""})
                  </h3>

                  <div className="space-y-3 mb-6">
                    {purchaseData.products.map(
                      (product: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white/60 rounded-lg p-4 border border-green-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-green-800">
                                {product.productName || `Product ${index + 1}`}
                              </h4>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="space-y-3">
                    <a
                      href="/"
                      className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 no-underline font-medium"
                    >
                      Back to Home
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 pt-6 border-t border-gray-200">
              {purchaseData.checkoutSessionId && (
                <div className="mb-4">
                  <p className="text-sm font-mono text-gray-800 bg-gray-100 px-3 py-2 rounded border">
                    Order ID: {purchaseData.checkoutSessionId}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
