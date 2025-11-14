import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Building2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

/* -------------------------------------------------------------
   UTIL: Safe getter (hyphen, snake, camel, dot-notation)
------------------------------------------------------------- */
const pick = (obj: any, keys: string[], fallback = "N/A") => {
  if (!obj) return fallback;

  for (const key of keys) {
    let val: any;

    if (key.includes(".")) {
      val = key.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
    } else {
      val = obj[key];
    }

    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }

  return fallback;
};

/* -------------------------------------------------------------
   UTIL: Address formatter
------------------------------------------------------------- */
const fmtAddress = (a: any) => {
  if (!a || typeof a !== "object") return "N/A";

  return [
    a.bno,
    a.bname,
    a.street,
    a.location,
    a.city ? `${a.city} - ${a.pincode || ""}` : "",
    a.state
  ]
    .filter(Boolean)
    .join(", ");
};

/* -------------------------------------------------------------
   UTIL: Date formatter
------------------------------------------------------------- */
const fmtDate = (raw: string) => {
  if (!raw) return "Invalid Date";

  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return raw;
};

/* -------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------- */
const GSTChecker = () => {
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo(null);

    if (gstin.trim().length !== 15) {
      toast.error("Enter a valid 15-digit GSTIN");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/gst/check_public", { gstin });
      const p = res.data;

      if (!p.success) {
        toast.error(p.error || "Invalid GSTIN");
        setLoading(false);
        return;
      }

      // Pick the deepest valid object
      const raw =
        p.data ||
        p.raw_wrapper?.result ||
        p.raw_wrapper?.result?.data ||
        p.raw_wrapper ||
        {};

      const address = fmtAddress(
        raw.adress || raw.address || raw.addr || raw.registered_address
      );

      const parsed = {
        gstin,
        legalName: pick(raw, ["legal-name", "legalName", "legal_name", "lgnm", "name"]),
        tradeName: pick(raw, ["trade-name", "tradeName", "trade_name", "tname"]),
        status: pick(raw, ["status", "gst_status", "registration_status"], "Unknown"),
        regDate: fmtDate(
          pick(raw, ["registration-date", "registrationDate", "reg_date"], "")
        ),
        businessType: pick(
          raw,
          ["entity-type", "entity_type", "businessType", "business_type"],
          "N/A"
        ),
        taxpayerType: pick(
          raw,
          ["dealer-type", "taxpayerType", "taxpayer_type", "tax_type"],
          "N/A"
        ),
        address,
      };

      setInfo(parsed);
      toast.success("GST details fetched");
    } catch (err) {
      console.error(err);
      toast.error("Backend error — check console");
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-3xl font-bold">GST Checker</h2>
          <p className="text-muted-foreground">Verify any GST-registered business instantly</p>
        </div>

        {/* Search Box */}
        <Card className="p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSearch} className="space-y-3">
            <Label>GST Number</Label>

            <div className="flex gap-3">
              <Input
                placeholder="Enter 15-digit GSTIN"
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="font-mono"
              />

              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary to-info-blue"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Search
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Result */}
        {info && (
          <Card className="p-8 rounded-2xl shadow-lg">
            
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-bold">{info.legalName}</h3>
                <p className="text-muted-foreground">{info.tradeName}</p>
              </div>

              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  info.status.toLowerCase().includes("active")
                    ? "bg-green-200 text-green-700"
                    : "bg-red-200 text-red-700"
                }`}
              >
                {info.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div>
                  <Label>GSTIN</Label>
                  <p className="font-mono font-semibold text-lg">{info.gstin}</p>
                </div>

                <div>
                  <Label>Business Type</Label>
                  <p className="font-medium">{info.businessType}</p>
                </div>

                <div>
                  <Label>Taxpayer Type</Label>
                  <p className="font-medium">{info.taxpayerType}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Registration Date</Label>
                  <p className="font-medium">{info.regDate}</p>
                </div>

                <div>
                  <Label>Address</Label>
                  <p className="font-medium">{info.address}</p>
                </div>
              </div>

            </div>
          </Card>
        )}

        {!info && (
          <Card className="p-6 rounded-2xl shadow-lg bg-info-blue/10 border-info-blue/20">
            <h3 className="font-semibold mb-2">About GST Checker</h3>
            <ul className="text-sm text-muted-foreground ml-6 space-y-1">
              <li>• Verify GST-registered businesses instantly</li>
              <li>• View registration details</li>
              <li>• Fetch status, address & business type</li>
            </ul>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default GSTChecker;
