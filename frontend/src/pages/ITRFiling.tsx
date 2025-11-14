import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { toast } = useToast();

  const [formData, setFormData] = useState<ITRDetails>({
    aadharNumber: "",
    panNumber: "",
    dateOfBirth: "",
    address: "",
    employmentType: "",
    annualSalary: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("itr_details");
    if (saved) {
      setFormData(JSON.parse(saved));
      setHasDetails(true);
    } else {
      setIsEditing(true);
    }
  }, []);

  const handleSave = () => {
    if (!formData.aadharNumber ||
        !formData.panNumber ||
        !formData.dateOfBirth ||
        !formData.address ||
        !formData.employmentType ||
        !formData.annualSalary) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("itr_details", JSON.stringify(formData));
    setHasDetails(true);
    setIsEditing(false);
    toast({
      title: "Details Saved",
      description: "Your ITR details have been saved successfully.",
    });
  };

  const handleChange = (field: keyof ITRDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const downloadITR = async () => {
    try {
      toast({ title: "Generating ITR PDF...", description: "Please wait." });

      const tRes = await api.get("/transactions/all?page=1");
      const transactions = tRes.data.transactions || [];

      const res = await api.post(
        "/itr/generate",
        {
          form_data: {
            name: "User", 
            dob: formData.dateOfBirth,
            aadhaar: formData.aadharNumber,
            pan: formData.panNumber,
            email: "user@example.com", 
            mobile: "0000000000",  
            employment: formData.employmentType,
            salary: Number(formData.annualSalary),
            address: formData.address,
          },
          transactions: transactions,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "ITR_Filled.pdf";
      a.click();

      toast({ title: "Download Ready", description: "Your ITR PDF is downloaded." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to generate ITR PDF",
        variant: "destructive",
      });
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
            {/* all your input fields stay same */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aadhar Number *</Label>
                <Input
                  value={formData.aadharNumber}
                  onChange={(e) => handleChange("aadharNumber", e.target.value)}
                  disabled={!isEditing}
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label>PAN Number *</Label>
                <Input
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                  disabled={!isEditing}
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Nature of Employment *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleChange("employmentType", value)}
                  disabled={!isEditing}
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
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address *</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
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
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {!isEditing && hasDetails && (
              <Button
                className="mt-4 w-full bg-gradient-to-r from-primary to-info-blue"
                onClick={downloadITR}
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
