import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Edit2, Save, Download } from "lucide-react";
import api from "@/lib/api";

interface ITRDetails {
  aadharNumber: string;
  panNumber: string;
  dateOfBirth: string;
  address: string;
  employmentType: string;
  annualSalary: string;
}

const ITRFiling = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [hasDetails, setHasDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ITRDetails>({
    aadharNumber: "",
    panNumber: "",
    dateOfBirth: "",
    address: "",
    employmentType: "",
    annualSalary: "",
  });

  // Load from backend on mount (fallback to localStorage)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/me"); // requires JWT
        const u = res.data;
        if (u && mounted) {
          const mapped: ITRDetails = {
            aadharNumber: u.aadhar_number || u.aadhar || "",
            panNumber: u.pan_number || u.pan || "",
            dateOfBirth: u.date_of_birth || "",
            address: u.address || "",
            employmentType: u.employment_type || "",
            annualSalary: u.annual_salary ? String(u.annual_salary) : "",
          };
          setFormData(mapped);
          setHasDetails(Boolean(mapped.aadharNumber || mapped.panNumber || mapped.dateOfBirth || mapped.address));
          setIsEditing(!Boolean(mapped.aadharNumber || mapped.panNumber || mapped.dateOfBirth || mapped.address));
          // cache locally
          localStorage.setItem("itr_details", JSON.stringify(mapped));
        }
      } catch (err) {
        // fallback to localStorage if backend not reachable or unauthenticated
        const saved = localStorage.getItem("itr_details");
        if (saved && mounted) {
          setFormData(JSON.parse(saved));
          setHasDetails(true);
          setIsEditing(false);
        } else if (mounted) {
          setIsEditing(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (field: keyof ITRDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save to backend (and cache locally)
  const handleSave = async () => {
    if (
      !formData.aadharNumber ||
      !formData.panNumber ||
      !formData.dateOfBirth ||
      !formData.address ||
      !formData.employmentType ||
      !formData.annualSalary
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // backend expects snake_case keys used in your auth.update_profile route
      const payload = {
        aadhar_number: formData.aadharNumber,
        pan_number: formData.panNumber,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        employment_type: formData.employmentType,
        annual_salary: Number(formData.annualSalary || 0),
      };

      await api.put("/auth/update-profile", payload);
      // cache locally
      localStorage.setItem("itr_details", JSON.stringify(formData));
      setHasDetails(true);
      setIsEditing(false);
      toast({ title: "Details Saved", description: "Your ITR details were saved." });
    } catch (err) {
      console.error("Save ITR details error:", err);
      toast({
        title: "Save failed",
        description: "Could not save details to server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Download PDF: send only the allowed form fields; backend will fetch transactions securely
  const downloadITR = async () => {
    setLoading(true);
    try {
      toast({ title: "Generating ITR PDF...", description: "Please wait." });

      // Prepare payload keys your backend expects (clean)
      const payload = {
        form_data: {
          name: undefined, // backend will fill name from DB via JWT if needed
          dob: formData.dateOfBirth,
          aadhaar: formData.aadharNumber,
          pan: formData.panNumber,
          employment: formData.employmentType,
          salary: Number(formData.annualSalary || 0),
          address: formData.address,
        },
      };

      const res = await api.post("/itr/generate", payload, { responseType: "blob" });

      // create downloadable link
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "ITR_Filled.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Download Ready", description: "Your ITR PDF has been downloaded." });
    } catch (err) {
      console.error("Download ITR error:", err);
      toast({
        title: "Error",
        description: "Failed to generate ITR PDF. Make sure you're logged in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-info-blue flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ITR Filing</h1>
            <p className="text-muted-foreground">Manage your Income Tax Return details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Enter your details for ITR filing" : "Your saved ITR details"}
                </CardDescription>
              </div>
              {hasDetails && !isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aadhar Number *</Label>
                <Input
                  value={formData.aadharNumber}
                  onChange={(e) => handleChange("aadharNumber", e.target.value)}
                  disabled={!isEditing || loading}
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label>PAN Number *</Label>
                <Input
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                  disabled={!isEditing || loading}
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Nature of Employment *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleChange("employmentType", value)}
                  disabled={!isEditing || loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">Salaried</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="pensioner">Pensioner</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Annual Salary *</Label>
                <Input
                  type="number"
                  value={formData.annualSalary}
                  onChange={(e) => handleChange("annualSalary", e.target.value)}
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address (2 lines)*</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={!isEditing || loading}
                rows={3}
              />
            </div>

            {isEditing ? (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Details
                </Button>

                {hasDetails && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const saved = localStorage.getItem("itr_details");
                      if (saved) setFormData(JSON.parse(saved));
                      setIsEditing(false);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ) : (
              <Button
                className="mt-4 w-full bg-gradient-to-r from-primary to-info-blue"
                onClick={downloadITR}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Your ITR PDF
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ITRFiling;
