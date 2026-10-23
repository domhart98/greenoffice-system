"use client";

import { useState, useEffect } from "react";
import { Payee } from "@/types/payee";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/loading_spinner";

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

interface PayeeFormProps {
  mode: "create" | "edit" | "view";
  payee?: Payee;
}

export default function PayeeForm({
  mode,
  payee,
}: PayeeFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);

  const [name, setName] = useState(payee?.name ?? "");
  const [address, setAddress] = useState(payee?.address ?? "");
  const [phone, setPhone] = useState(payee?.phone ?? "");
  const [email, setEmail] = useState(payee?.email ?? "");
  const [payeeType, setPayeeType] = useState(payee?.payee_type ?? "OTHER");
  const [employeeId, setEmployeeId] = useState(
    payee?.employee_id
      ? String(payee.employee_id)
      : ""
  );
  const [supplierId, setSupplierId] = useState(
    payee?.supplier_id
      ? String(payee.supplier_id)
      : ""
  );
  const [companyName, setCompanyName] = useState(payee?.company_name ?? "");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [supplierResponse, employeeResponse] =
          await Promise.all([
            fetch("/api/suppliers"),
            fetch("/api/employees"),
          ]);

        if (!supplierResponse.ok) {
          throw new Error("Failed to load suppliers");
        }

        if (!employeeResponse.ok) {
          throw new Error("Failed to load employees");
        }

        const supplierData =
          await supplierResponse.json();

        const employeeData =
          await employeeResponse.json();

        setSuppliers(supplierData);
        setEmployees(employeeData);
      } catch (error) {
        console.error(error);
        toast.error(
          "Failed to load supplier and employee information."
        );
      } finally {
        setLoadingLists(false);
      }
    };

    fetchLists();
  }, []);

  const handleTypeChange = (value: PayeeType) => {
    setPayeeType(value);

    if (value !== "SUPPLIER") {
      setSupplierId("");
    }

    if (value !== "EMPLOYEE") {
      setEmployeeId("");
    }
  };

  async function handleCreatePayee() {
    if (isViewMode) return;

    try{
      const response = await fetch("/api/payees",
        {
          method: "POST",

          headers: {
            "Content-Type":"application/json",
          },

          body: JSON.stringify({
            name,
            payee_type: payeeType,
            address,
            email,
            phone,
            company_name: companyName,
            employee_id: employeeId,
            supplier_id: supplierId
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push("/payees");
      }
    } catch (error) {
      console.log(error);    }
  };

  async function handleUpdatePayee() {
    if (isViewMode) return;

    try{
      const response = await fetch(`/api/payees/${payee?.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":"application/json",
          },

          body: JSON.stringify({
            name,
            payee_type: payeeType,
            address,
            email,
            phone,
            company_name: companyName,
            employee_id: employeeId,
            supplier_id: supplierId
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push("/payees");
      }
    } catch (error) {
      console.log(error);    }
  };

  if (loadingLists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="form-card">
        <section className="form-section">
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                {/* Payee Type */}
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payee Type
                </label>

                <select
                  value={payeeType}
                  onChange={(e) =>
                    handleTypeChange(
                      e.target.value as PayeeType
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                >
                  <option value="OTHER">
                    Other
                  </option>

                  <option value="SUPPLIER">
                    Supplier
                  </option>

                  <option value="EMPLOYEE">
                    Employee
                  </option>
                </select>
              </div>

              <div>
                {/* Supplier */}
                {payeeType === "SUPPLIER" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Supplier
                    </label>

                    <select
                      value={supplierId}
                      onChange={(e) =>
                        setSupplierId(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                      disabled={isViewMode}
                    >
                      <option value="">
                        Select supplier
                      </option>

                      {suppliers.map((supplier) => (
                        <option
                          key={supplier.id}
                          value={supplier.id}
                        >
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Employee */}
                {payeeType === "EMPLOYEE" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Employee
                    </label>

                    <select
                      value={employeeId}
                      onChange={(e) =>
                        setEmployeeId(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                      disabled={isViewMode}
                    >
                      <option value="">
                        Select employee
                      </option>

                      {employees.map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.first_name}{" "}
                          {employee.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Payee Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payee Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter payee name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                />
              </div>

              {/* Company */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Company Name
                </label>

                <input
                  type="text"
                  value={companyName}
                  onChange={(e) =>
                    setCompanyName(e.target.value)
                  }
                  placeholder="Company name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                />
              </div>

              {/* Address */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  rows={3}
                  placeholder="Address"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    disabled={isViewMode}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>
          </div>
          
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/payees")}
            className="form-secondary-button"
          >
            {isViewMode ? "Back" : "Cancel"}
          </button>

          {isViewMode && payee && (
            <button
              type="button"
              onClick={() => router.push(`/payees/${payee.id}/edit`)}
              disabled={loading}
              className="form-primary-button"
            >
              Edit Payee
            </button>
          )}

          {isCreateMode && (
            <button
              type="button"
              onClick={handleCreatePayee}
              disabled={loading}
              className="form-primary-button"
            >
              Create Payee
            </button>
          )}

          {isEditMode && payee && (
            <button
              type="button"
              onClick={handleUpdatePayee}
              disabled={loading}
              className="form-primary-button"
            >
              Update Payee
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}