"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/loading_spinner";
import toast from "react-hot-toast";
import PayeeForm from "@/components/forms/payee_form";

type Supplier = {
  id: number;
  name: string;
};

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
};

type PayeeType = "SUPPLIER" | "EMPLOYEE" | "OTHER";

export default function NewPayeePage() {
  const router = useRouter();

  const [payeeType, setPayeeType] = useState<PayeeType>("OTHER");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [suppliersResponse, employeesResponse] =
          await Promise.all([
            fetch("/api/suppliers"),
            fetch("/api/employees"),
          ]);

        if (!suppliersResponse.ok) {
          throw new Error("Failed to load suppliers");
        }

        if (!employeesResponse.ok) {
          throw new Error("Failed to load employees");
        }

        const suppliersData = await suppliersResponse.json();
        const employeesData = await employeesResponse.json();

        setSuppliers(suppliersData);
        setEmployees(employeesData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load payee information.");
      } finally {
        setLoadingLists(false);
      }
    };

    fetchLists();
  }, []);

  const handlePayeeTypeChange = (type: PayeeType) => {
    setPayeeType(type);

    // Clear unrelated relationships.
    if (type !== "SUPPLIER") {
      setSupplierId("");
    }

    if (type !== "EMPLOYEE") {
      setEmployeeId("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Payee name is required.");
      return;
    }

    if (payeeType === "SUPPLIER" && !supplierId) {
      toast.error("Please select a supplier.");
      return;
    }

    if (payeeType === "EMPLOYEE" && !employeeId) {
      toast.error("Please select an employee.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/payees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          payee_type: payeeType,
          supplier_id:
            payeeType === "SUPPLIER"
              ? Number(supplierId)
              : null,
          employee_id:
            payeeType === "EMPLOYEE"
              ? Number(employeeId)
              : null,
          company_name: companyName || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create payee"
        );
      }

      toast.success("Payee created.");

      router.push("/payees");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || "Failed to create payee."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingLists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          New Payee
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a supplier, employee, or other business payee.
        </p>
      </div>
      <PayeeForm mode="create"/>
      
    </div>
  );
}