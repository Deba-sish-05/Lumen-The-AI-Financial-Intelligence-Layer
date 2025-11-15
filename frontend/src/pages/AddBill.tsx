import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const AddBill = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    const vendor = (document.getElementById("vendor") as HTMLInputElement).value;
    const notes = (document.getElementById("notes") as HTMLInputElement).value;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("vendor", vendor);
      formData.append("category", category);
      formData.append("notes", notes);

      const res = await api.post("/document/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("AI Analysis Complete!");
      setResult(res.data);
      setSelectedFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload bill");
    }

    setIsProcessing(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold">Add New Bill</h2>
          <p className="text-muted-foreground">
            Upload your bill or receipt for AI-powered analysis
          </p>
        </div>

        {/* FORM */}
        <Card className="p-10 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* FILE UPLOAD */}
            <div className="space-y-2">
              <Label>Upload Document</Label>

              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                />

                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  {selectedFile ? (
                    <>
                      <FileText className="h-16 w-16 text-primary" />
                      <p className="font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 text-muted-foreground" />
                      <p className="font-semibold">Click to upload or drag & drop</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* VENDOR + CATEGORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor Name</Label>
                <Input id="vendor" placeholder="Southern Express Café" />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="bills">Bills</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Additional context..." />
            </div>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full py-6 text-lg bg-gradient-to-r from-primary to-info-blue"
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="mr-3 h-5 w-5" />
                  Upload & Analyze
                </>
              )}
            </Button>

          </form>
        </Card>

        {/* RESULT PANEL */}
        {result && (
          <Card className="p-10 rounded-2xl shadow-2xl border border-primary/40 bg-white space-y-10">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">AI Analysis Report</h3>
                <p className="text-muted-foreground">Full breakdown of your bill</p>
              </div>

              <div
                className={`px-4 py-1 rounded-full text-sm font-semibold ${
                  result.llm.legitimacy === "verified"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {result.llm.legitimacy.toUpperCase()}
              </div>
            </div>

            {/* SUMMARY */}
            <div className="p-6 bg-muted/40 border rounded-xl">
              <div className="text-lg font-bold flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                Summary
              </div>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {result.llm.legitimacy_report}
              </p>
            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

              <div className="space-y-3">
                <h4 className="text-lg font-semibold border-b pb-1">Bill Details</h4>
                <p><b>Item:</b> {result.llm.item_name}</p>
                <p><b>Amount:</b> ₹{result.llm.amount}</p>
                <p><b>Category:</b> {result.llm.category}</p>
                <p><b>Payment Mode:</b> {result.llm.payment_mode || "-"}</p>
                <p><b>Date:</b> {result.llm.transaction_date || "-"}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold border-b pb-1">Vendor & Tax</h4>
                <p><b>Vendor:</b> {result.llm.vendor}</p>
                <p><b>GST Number:</b> {result.llm.gst_number || "N/A"}</p>
                <p><b>Status:</b> {result.status}</p>
                <p><b>Description:</b> {result.llm.description || "-"}</p>
              </div>

            </div>

            {/* GST VERIFICATION */}
            {result.gst_details && (
              <div className="p-6 bg-primary/5 border border-primary/30 rounded-xl space-y-3">
                <h4 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  GST Verification
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><b>Legal Name:</b> {result.gst_details.legal_name}</p>
                  <p><b>Trade Name:</b> {result.gst_details.trade_name}</p>
                  <p><b>Status:</b> {result.gst_details.status}</p>
                  <p><b>PAN:</b> {result.gst_details.pan}</p>
                  <p><b>State:</b> {result.gst_details.state}</p>
                  <p><b>Last Updated:</b> {result.gst_details.last_updated}</p>
                  <p className="md:col-span-2">
                    <b>Address:</b> {result.gst_details.address}
                  </p>
                </div>
              </div>
            )}

            {result.file_url && (
              <Button
                className="w-full py-6 text-lg"
                onClick={() =>
                  window.open(`http://localhost:5000${result.file_url}`, "_blank")
                }
              >
                <Upload className="mr-2 h-5 w-5" />
                Download Original Bill
              </Button>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AddBill;
