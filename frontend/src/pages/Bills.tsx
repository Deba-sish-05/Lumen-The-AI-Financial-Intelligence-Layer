import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Bills = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch All
  const fetchTransactions = async (pageNum: number, cat?: string, sort?: string) => {
    try {
      const query = `/transactions/all?page=${pageNum}${cat ? `&category=${cat}` : ""}&sort=${sort}`;
      const res = await api.get(query);

      setTransactions(res.data.transactions || []);
      setPage(res.data.page || pageNum);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  useEffect(() => {
    fetchTransactions(page, category, sortOrder);
  }, [page, category, sortOrder]);

  // Single fetch
  const fetchTransactionDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/transactions/${id}`);
      setSelected(res.data);
    } catch (err) {
      console.error("Failed to fetch details", err);
      const fallback = transactions.find((t) => t.id === id);
      if (fallback) setSelected(fallback);
    } finally {
      setLoadingDetails(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: any = {
      verified: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600" },
      pending: { icon: <FileCheck className="h-4 w-4" />, color: "text-yellow-600" },
      rejected: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
    };

    const s = map[status] || map.rejected;

    return (
      <div className={`flex items-center gap-2 ${s.color}`}>
        {s.icon}
        <span className="font-medium capitalize">{status}</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Past Transactions</h2>
          <p className="text-muted-foreground">View and manage your financial records</p>
        </div>

        <Button
          className="bg-gradient-to-r from-primary to-info-blue"
          onClick={() => navigate("/add-transaction")}
        >
          Add New Transaction
        </Button>
      </div>

      {/* CATEGORY FILTER */}
      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="border px-4 py-2 rounded-xl bg-white shadow"
        >
          <option value="">All Categories</option>
          <option value="food">Food</option>
          <option value="groceries">Groceries</option>
          <option value="travel">Travel</option>
          <option value="bills">Bills</option>
          <option value="entertainment">Entertainment</option>
          <option value="health">Health</option>
          <option value="education">Education</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* TABLE */}
      <Card className="rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  Date {sortOrder === "asc" ? "↑" : "↓"}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    {new Date(t.transaction_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium">{t.vendor || "-"}</td>

                  <td className="px-6 py-4 text-sm">
                    <Badge variant="outline">{t.category}</Badge>
                  </td>

                  <td
                    className={`px-6 py-4 text-sm font-semibold ${
                      Number(t.amount) < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ₹{Math.abs(Number(t.amount)).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={t.status} />
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingDetails}
                      onClick={() => fetchTransactionDetails(t.id)}
                    >
                      View Report
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PAGINATION */}
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>

        <div className="px-4 py-2 border rounded-lg">
          Page {page} of {totalPages}
        </div>

        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <Card className="p-6 rounded-2xl shadow-lg bg-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {transactions.filter((t) => t.status === "verified").length}
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
                {transactions.filter((t) => t.status === "pending").length}
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
                {transactions.filter((t) => t.status === "rejected").length}
              </p>
              <p className="text-sm text-muted-foreground">Suspicious</p>
            </div>
          </div>
        </Card>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-3 right-3" onClick={() => setSelected(null)}>
              <X className="h-5 w-5 text-gray-500 hover:text-black" />
            </button>

            <h2 className="text-2xl font-bold mb-4">Bill Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <p><strong>Vendor:</strong> {selected.vendor || ""}</p>
                <p><strong>Amount:</strong> ₹{Math.abs(Number(selected.amount)).toFixed(2)}</p>
                <p><strong>Category:</strong> {selected.category || ""}</p>
                <p><strong>Payment:</strong> {selected.payment_mode || ""}</p>
                <p><strong>Date:</strong> {new Date(selected.transaction_date).toLocaleDateString("en-IN")}</p>
                <p><strong>Status:</strong> {selected.status}</p>
                <p><strong>Description:</strong> {selected.description || ""}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-2">Bill Preview</p>

                {selected.file_url ? (
                  selected.file_url.endsWith(".pdf") ? (
                    <div className="w-full h-48 border rounded-lg flex items-center justify-center bg-gray-100">
                      <p className="text-gray-600 text-sm">PDF Preview Not Available</p>
                    </div>
                  ) : (
                    <img
                      src={"http://localhost:5000" + selected.file_url}
                      alt="Bill Preview"
                      className="w-full h-48 object-contain rounded-lg border"
                    />
                  )
                ) : (
                  <div className="w-full h-48 border rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                    No File
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full mt-5 bg-blue-600 text-white"
              onClick={() =>
                selected.file_url && window.open("http://localhost:5000" + selected.file_url, "_blank")
              }
            >
              Download Bill
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Bills;
