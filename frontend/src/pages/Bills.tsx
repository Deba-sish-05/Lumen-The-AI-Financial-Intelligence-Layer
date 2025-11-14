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

  // 🔥 CATEGORY FILTER STATE
  const [category, setCategory] = useState<string>("");

  const fetchTransactions = async (pageNum: number, cat?: string) => {
    try {
      const query = `/transactions/all?page=${pageNum}${
        cat ? `&category=${cat}` : ""
      }`;

      const res = await api.get(query);

      setTransactions(res.data.transactions || []);
      setPage(res.data.page || pageNum);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  // Fetch on page or category change
  useEffect(() => {
    fetchTransactions(page, category);
  }, [page, category]);

  const fetchTransactionDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/transactions/${id}`);
      setSelected(res.data);
    } catch (err) {
      console.error("Failed to fetch transaction details", err);
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
      {/* Header */}
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

      {/* 🔥 CATEGORY FILTER DROPDOWN */}
      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => {
            setPage(1); // reset page on filter
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
                      Number(t.amount) >= 0 ? "text-red-600" : "text-green-600"
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
                      onClick={() => fetchTransactionDetails(t.id)}
                      disabled={loadingDetails}
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

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
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

      {/* Bottom Stats */}
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
    </DashboardLayout>
  );
};

export default Bills;
