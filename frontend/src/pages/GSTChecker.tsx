import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Building2, Loader2, Code } from "lucide-react";
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

// helper to safely read many candidate keys (supports hyphenated keys)
const getVal = (obj: any, candidates: string[], fallback = ""): string => {
  if (!obj) return fallback;
  for (const k of candidates) {
    if (k.includes(".")) {
      // support nested dot paths
      const parts = k.split(".");
      let cur = obj;
      let ok = true;
      for (const p of parts) {
        if (cur && cur[p] !== undefined && cur[p] !== null) cur = cur[p];
        else { ok = false; break; }
      }
      if (ok && String(cur).trim() !== "") return String(cur);
    } else {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
        return String(obj[k]);
      }
    }
  }
  return fallback;
};

// provider address formatter for the "adress" object in your payload
const formatAddressFromProvider = (addrObj: any) => {
  if (!addrObj || typeof addrObj !== "object") return "N/A";
  const bno = addrObj.bno || addrObj["b-no"] || "";
  const bname = addrObj.bname || "";
  const street = addrObj.street || "";
  const location = addrObj.location || "";
  const city = addrObj.city || "";
  const pincode = addrObj.pincode || addrObj.pin || "";
  const state = addrObj.state || "";

  const parts = [
    [bno, bname].filter(Boolean).join(" "),
    street,
    location,
    city ? `${city}${pincode ? " - " + pincode : ""}` : (pincode ? pincode : ""),
    state,
  ].filter(Boolean);

  return parts.join(", ") || "N/A";
};

// find the best candidate object from the backend response
const findPossibleData = (payload: any) => {
  if (!payload) return {};
  if (payload.data && typeof payload.data === "object" && Object.keys(payload.data).length > 0) return payload.data;
  if (payload.raw_wrapper?.result && typeof payload.raw_wrapper.result === "object") {
    const r = payload.raw_wrapper.result;
    // If result itself looks like the real object, return it
    if (Object.keys(r).length > 0) return r;
    if (r.data && Object.keys(r.data || {}).length > 0) return r.data;
    if (r.company && Object.keys(r.company || {}).length > 0) return r.company;
    if (r.response && Object.keys(r.response || {}).length > 0) return r.response;
  }
  // sometimes backend returned the raw object at top level
  if (payload && typeof payload === "object" && Object.keys(payload).length > 0) return payload;
  return {};
};

const formatDateFriendly = (raw: string) => {
  if (!raw) return "Invalid Date";
  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }
  // fallback: attempt dd-mm-yyyy or dd/mm/yyyy
  const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const monthName = new Date(`${yyyy}-${mm}-01`).toLocaleString("en-IN", { month: "long" });
    return `${parseInt(dd, 10)} ${monthName} ${yyyy}`;
  }
  return "Invalid Date";
};

const GSTChecker: React.FC = () => {
  const [gstNumber, setGstNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gstData, setGstData] = useState<GSTData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGstData(null);

    const gst = (gstNumber || "").trim().toUpperCase();
    if (gst.length !== 15) {
      toast.error("Please enter a valid 15-character GSTIN");
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch("http://localhost:5000/gst/check_public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstin: gst }),
      });

      if (resp.status === 401 || resp.status === 403) {
        toast.error("Backend requires authentication. Start backend with public route or provide token.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 404) {
        toast.error("Backend endpoint not found. Ensure /gst/check_public exists.");
        setIsLoading(false);
        return;
      }

      const payload = await resp.json();

      if (!payload || payload.success === false) {
        const err = (payload && (payload as any).error) || "Invalid GSTIN was given";
        toast.error(err === "Invalid GSTIN was given" ? "Invalid GSTIN was given" : err);
        setIsLoading(false);
        return;
      }

      // if backend explicitly indicates no details
      if (payload.has_details === false) {
        toast.error("No public details found for this GSTIN");
        setIsLoading(false);
        return;
      }

      const d = findPossibleData(payload);

      // provider-specific mapping (handles hyphenated keys and nested address "adress")
      const addressObj = d["adress"] || d["address"] || d["addr"] || d["registered_address"] || {};

      const mapped: GSTData = {
        gstin: gst,
        legalName: getVal(d, ["legal-name", "legalName", "legal_name", "lgnm", "businessName", "name"], "N/A"),
        tradeName: getVal(d, ["trade-name", "tradeName", "trade_name", "tname"], "N/A"),
        status: getVal(d, ["status", "gst_status", "registration_status"], "Unknown"),
        registrationDate: getVal(d, ["registration-date", "registrationDate", "reg_date", "registration_date", "date"], ""),
        address: formatAddressFromProvider(addressObj),
        businessType: getVal(d, ["entity-type", "businessType", "business_type", "entity_type"], "N/A"),
        taxpayerType: getVal(d, ["dealer-type", "taxpayerType", "taxpayer_type", "tax_type"], "N/A"),
      };

      // if still empty, explicitly tell user
      const likelyEmpty = (mapped.legalName === "N/A" || mapped.legalName === "") &&
                          (mapped.address === "N/A" || mapped.address === "") &&
                          !mapped.registrationDate;
      if (likelyEmpty) {
        toast.error("No public details found for this GSTIN");
        setIsLoading(false);
        return;
      }

      setGstData(mapped);
      toast.success("GST details fetched");
    } catch (err: any) {
      console.error("GST lookup error:", err);
      toast.error("Error fetching GST details. Ensure backend is running at http://localhost:5000");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">GST Checker</h2>
          <p className="text-muted-foreground">Verify and retrieve company details using GST number</p>
        </div>

        <Card className="p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gst">GST Number (GSTIN)</Label>
              <div className="flex gap-3">
                <Input id="gst" placeholder="Enter 15-digit GSTIN" value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} maxLength={15} className="font-mono" />
                <Button type="submit" className="bg-gradient-to-r from-primary to-info-blue" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-2 h-4 w-4" />Search</>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Example: 29AABCT1332L1Z5</p>
            </div>
          </form>
        </Card>

        {gstData ? (
          <Card className="p-8 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{gstData.legalName}</h3>
                <p className="text-muted-foreground">{gstData.tradeName}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${gstData.status && gstData.status.toLowerCase().includes("active") ? "bg-success-green/20 text-success-green" : "bg-destructive/20 text-destructive"}`}>
                {gstData.status || "Unknown"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><Label className="text-muted-foreground">GSTIN</Label><p className="font-mono font-semibold text-lg">{gstData.gstin}</p></div>
                <div><Label className="text-muted-foreground">Business Type</Label><p className="font-medium">{gstData.businessType}</p></div>
                <div><Label className="text-muted-foreground">Taxpayer Type</Label><p className="font-medium">{gstData.taxpayerType}</p></div>
              </div>

              <div className="space-y-4">
                <div><Label className="text-muted-foreground">Registration Date</Label><p className="font-medium">{gstData.registrationDate ? formatDateFriendly(gstData.registrationDate) : "Invalid Date"}</p></div>
                <div><Label className="text-muted-foreground">Address</Label><p className="font-medium">{gstData.address}</p></div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 rounded-2xl shadow-lg bg-info-blue/10 border-info-blue/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Building2 className="h-5 w-5 text-info-blue" />About GST Checker</h3>
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
