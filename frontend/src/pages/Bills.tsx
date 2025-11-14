import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Bills = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async (pageNum: number) => {
    try {
      const res = await api.get(`/transactions/all?page=${pageNum}`);

      setTransactions(res.data.transactions);
      setPage(res.data.page);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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

        <Card className="rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      {new Date(t.transaction_date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium">
                      {t.vendor || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">{t.category}</Badge>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold">
                      ₹{Number(t.amount).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-sm">
                      {t.status === "verified" && (
                        <div className="flex items-center gap-2 text-success-green">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Verified</span>
                        </div>
                      )}

                      {t.status === "pending" && (
                        <div className="flex items-center gap-2 text-warning-orange">
                          <FileCheck className="h-4 w-4" />
                          <span className="font-medium">Pending</span>
                        </div>
                      )}

                      {t.status === "rejected" && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Rejected</span>
                        </div>
                      )}
                    </td>

                    {/* Download button */}
                    <td className="px-6 py-4 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!t.file_url}
                        onClick={() => {
                          if (t.file_url) window.open(t.file_url, "_blank");
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex justify-center gap-4">
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
      </div>
    </DashboardLayout>
  );
};

export default Bills;
