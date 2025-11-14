import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GSTData {
  gstin: string;
  legalName: string;
  tradeName: string;
  status: string;
  registrationDate: string;
  address: string;
  businessType: string;
  taxpayerType: string;
}

const GSTChecker = () => {
  const [gstNumber, setGstNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gstData, setGstData] = useState<GSTData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gstNumber || gstNumber.length !== 15) {
      toast.error("Please enter a valid 15-digit GST number");
      return;
    }

    setIsLoading(true);
    
    // TODO: Implement actual GST API call
    // Simulating API response
    setTimeout(() => {
      setGstData({
        gstin: gstNumber,
        legalName: "ABC PRIVATE LIMITED",
        tradeName: "ABC Trading Co.",
        status: "Active",
        registrationDate: "2018-07-15",
        address: "123, Business Street, Mumbai, Maharashtra - 400001",
        businessType: "Private Limited Company",
        taxpayerType: "Regular",
      });
      setIsLoading(false);
      toast.success("GST details fetched successfully");
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">GST Checker</h2>
          <p className="text-muted-foreground">
            Verify and retrieve company details using GST number
          </p>
        </div>

        {/* Search Card */}
        <Card className="p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gst">GST Number (GSTIN)</Label>
              <div className="flex gap-3">
                <Input
                  id="gst"
                  placeholder="Enter 15-digit GST number"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="font-mono"
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-info-blue"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: 29AABCT1332L1Z5
              </p>
            </div>
          </form>
        </Card>

        {/* Results Card */}
        {gstData && (
          <Card className="p-8 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{gstData.legalName}</h3>
                <p className="text-muted-foreground">{gstData.tradeName}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  gstData.status === "Active"
                    ? "bg-success-green/20 text-success-green"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                {gstData.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">GSTIN</Label>
                  <p className="font-mono font-semibold text-lg">{gstData.gstin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Business Type</Label>
                  <p className="font-medium">{gstData.businessType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Taxpayer Type</Label>
                  <p className="font-medium">{gstData.taxpayerType}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Registration Date</Label>
                  <p className="font-medium">
                    {new Date(gstData.registrationDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{gstData.address}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        {!gstData && (
          <Card className="p-6 rounded-2xl shadow-lg bg-info-blue/10 border-info-blue/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-info-blue" />
              About GST Checker
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• Verify the authenticity of any GST-registered business</li>
              <li>• Get real-time company information from government records</li>
              <li>• Check GST status before business transactions</li>
              <li>• Ensure compliance and reduce fraud risk</li>
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GSTChecker;
