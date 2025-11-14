import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Bills = () => {
  const navigate = useNavigate();
  const [billsData, setBillsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await api.get("/bills/all");
        setBillsData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBills();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Past Transactions</h2>
            <p className="text-muted-foreground">
              View and manage your uploaded financial documents
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-primary to-info-blue"
            onClick={() => navigate("/add-bill")}
          >
            Upload New Bill
          </Button>
        </div>

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
                {billsData.map((bill: any) => (
                  <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      {new Date(bill.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{bill.vendor}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">{bill.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ₹{Number(bill.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {bill.legitimacy === "verified" && (
                        <div className="flex items-center gap-2 text-success-green">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Verified</span>
                        </div>
                      )}
                      {bill.legitimacy === "pending" && (
                        <div className="flex items-center gap-2 text-warning-orange">
                          <FileCheck className="h-4 w-4" />
                          <span className="font-medium">Pending</span>
                        </div>
                      )}
                      {bill.legitimacy === "suspicious" && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Suspicious</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          window.open(bill.documentUrl, "_blank");
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* UI unchanged */}
          <Card className="p-6 rounded-2xl shadow-lg bg-success-green/10 border-success-green/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-success-green" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Verified Bills</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg bg-warning-orange/10 border-warning-orange/20">
            <div className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-warning-orange" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Suspicious</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Bills;
