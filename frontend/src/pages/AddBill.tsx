import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AddBill = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsProcessing(true);
    
    // TODO: Implement actual file upload and LLM processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Bill uploaded successfully! AI is processing your document.");
      setSelectedFile(null);
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Add New Bill</h2>
          <p className="text-muted-foreground">
            Upload your bill or receipt for AI-powered analysis
          </p>
        </div>

        <Card className="p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Upload Document</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  {selectedFile ? (
                    <>
                      <FileText className="h-16 w-16 text-primary" />
                      <div>
                        <p className="font-semibold">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">
                          PDF, JPG, PNG up to 10MB
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor Name (Optional)</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., Southern Express Café"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  placeholder="e.g., Food, Bills, Travel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add any additional context..."
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-info-blue"
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="p-6 rounded-2xl shadow-lg bg-info-blue/10 border-info-blue/20">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-info-blue" />
            How it works
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-7">
            <li>• Upload your bill or receipt</li>
            <li>• Our AI extracts key information automatically</li>
            <li>• Document is verified for authenticity</li>
            <li>• Data is categorized and added to your analytics</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddBill;
