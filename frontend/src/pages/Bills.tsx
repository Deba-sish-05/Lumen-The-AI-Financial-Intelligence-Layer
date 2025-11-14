// Bills.tsx
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileCheck, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Bills = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchTransactions = async (pageNum: number) => {
    try {
      const res = await api.get(`/transactions/all?page=${pageNum}`);
      setTransactions(res.data.transactions || []);
      setPage(res.data.page || pageNum);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchTransactionDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/transactions/${id}`); // must return llm + gst_details + file_url
      setSelected(res.data);
    } catch (err) {
      console.error("Failed to fetch transaction details", err);
      // fallback: if the list item already contained enough, keep that
      const fallback = transactions.find((t) => t.id === id);
      if (fallback) setSelected(fallback);
    } finally {
      setLoadingDetails(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "verified")
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Verified</span>
        </div>
      );

    if (status === "pending")
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <FileCheck className="h-4 w-4" />
          <span className="font-medium">Pending</span>
        </div>
      );

    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">Rejected</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Modal for detailed report */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />

          <div className="relative bg-white max-w-2xl w-[92%] md:w-[800px] rounded-2xl shadow-2xl overflow-auto z-50 p-6">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-black"
              aria-label="close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Bill Report</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI extraction + GST verification
                </p>
              </div>

              <div className="text-right">
                <Badge variant="outline">{selected.status || "N/A"}</Badge>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left: Summary */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 bg-muted/40 rounded-lg border">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Summary
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {selected.llm?.legitimacy_report || selected.legitimacy_report || "No summary provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Bill Details</h4>
                    <p><b>Item:</b> {selected.llm?.item_name || selected.item_name || "-"}</p>
                    <p><b>Amount:</b> ₹{Math.abs(Number(selected.llm?.amount ?? selected.amount ?? 0)).toFixed(2)}</p>
                    <p><b>Category:</b> {selected.llm?.category || selected.category || "-"}</p>
                    <p><b>Payment Mode:</b> {selected.llm?.payment_mode || selected.payment_mode || "-"}</p>
                    <p><b>Date:</b> {selected.llm?.transaction_date || selected.transaction_date || "-"}</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Vendor & Notes</h4>
                    <p><b>Vendor:</b> {selected.llm?.vendor || selected.vendor || "-"}</p>
                    <p><b>Description:</b> {selected.llm?.description || selected.description || "-"}</p>
                    <p><b>Tags:</b> {selected.llm?.tags || selected.tags || "-"}</p>
                    <p className="mt-2 text-sm text-muted-foreground"><b>Source:</b> {selected.file_url ? "Uploaded file" : "Manual"}</p>
                  </div>
                </div>

                {/* GST block */}
                {selected.gst_details && (
                  <div className="mt-4 p-4 rounded-lg border bg-primary/5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">GST Verification</h4>
                      <div className="text-sm text-muted-foreground">{selected.gst_details.status || ""}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                      <p><b>Legal Name:</b> {selected.gst_details.legal_name || "-"}</p>
                      <p><b>Trade Name:</b> {selected.gst_details.trade_name || "-"}</p>
                      <p><b>PAN:</b> {selected.gst_details.pan || "-"}</p>
                      <p><b>Constitution:</b> {selected.gst_details.constitution || "-"}</p>
                      <p><b>Registration Date:</b> {selected.gst_details.registration_date || "-"}</p>
                      <p><b>Last Updated:</b> {selected.gst_details.last_updated || "-"}</p>
                      <p className="md:col-span-2"><b>Address:</b> {selected.gst_details.address || "-"}, {selected.gst_details.district || ""}, {selected.gst_details.state || ""} {selected.gst_details.pincode ? `- ${selected.gst_details.pincode}` : ""}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Actions + file preview */}
              <div className="space-y-4">
                <div className="p-4 border rounded-lg flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="font-semibold mt-1">{selected.status || "-"}</div>
                    </div>
                    <div>
                      <button
                        className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                        onClick={() => {
                          // refresh details
                          if (selected.id) fetchTransactionDetails(selected.id);
                        }}
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {selected.file_url && (
                    <Button
                      onClick={() => window.open(`http://localhost:5000${selected.file_url}`, "_blank")}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Bill
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      // navigate to an edit page if you have one
                      if (selected.transaction_id || selected.id) {
                        navigate(`/transactions/edit/${selected.transaction_id || selected.id}`);
                      }
                    }}
                  >
                    Edit Transaction
                  </Button>
                </div>

                <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                  <div className="font-semibold mb-2">AI Confidence</div>
                  <div>{selected.llm?.legitimacy_report || "No confidence data"}</div>
                </div>

                {/* optional small preview if image */}
                {selected.file_url && (
                  <div className="p-2 border rounded-lg overflow-hidden">
                    <img
                      src={`http://localhost:5000${selected.file_url}`}
                      alt="bill preview"
                      className="w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Past Transactions</h2>
          <p className="text-muted-foreground">
            View and manage your financial records
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-info-blue"
          onClick={() => navigate("/add-transaction")}
        >
          Add New Transaction
        </Button>
      </div>

      {/* Table */}
      <Card className="rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {transactions.map((t: any) => (
                <tr
                  key={t.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm">
                    {new Date(t.transaction_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium">
                    {t.vendor || "-"}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <Badge variant="outline">{t.category}</Badge>
                  </td>

                  <td
                    className={`px-6 py-4 text-sm font-semibold ${
                      Number(t.amount) >= 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ₹{Math.abs(Number(t.amount)).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={t.status} />
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTransactionDetails(t.id)}
                        disabled={loadingDetails}
                      >
                        View Report
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>

        <div className="px-4 py-2 border rounded-lg">
          Page {page} of {totalPages}
        </div>

        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
        
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
  <Card className="p-6 rounded-2xl shadow-lg bg-green-100 border-green-200">
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-8 w-8 text-green-600" />
      <div>
        <p className="text-2xl font-bold">
          {transactions.filter(t => t.status === "verified").length}
        </p>
        <p className="text-sm text-muted-foreground">Verified Bills</p>
      </div>
    </div>
  </Card>

  <Card className="p-6 rounded-2xl shadow-lg bg-yellow-100 border-yellow-200">
    <div className="flex items-center gap-3">
      <FileCheck className="h-8 w-8 text-yellow-600" />
      <div>
        <p className="text-2xl font-bold">
          {transactions.filter(t => t.status === "pending").length}
        </p>
        <p className="text-sm text-muted-foreground">Pending Review</p>
      </div>
    </div>
  </Card>

  <Card className="p-6 rounded-2xl shadow-lg bg-red-100 border-red-200">
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-8 w-8 text-red-600" />
      <div>
        <p className="text-2xl font-bold">
          {transactions.filter(t => t.status === "rejected").length}
        </p>
        <p className="text-sm text-muted-foreground">Suspicious</p>
      </div>
    </div>
  </Card>
</div>
    </DashboardLayout>
  );
};

export default Bills;
