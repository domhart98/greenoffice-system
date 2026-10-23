"use client";

import { useState, useEffect } from "react";
import { Customer } from "@/types/customer";
import { useRouter } from "next/navigation";

interface CustomerFormProps {
  mode: "create" | "edit" | "view";
  customer?: Customer;
}

export default function CustomerForm({mode, customer,}: CustomerFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(customer?.name ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [dateCreated, setDateCreated] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [state, setState] = useState(customer?.state ?? "");
  const [country, setCountry] = useState(customer?.country ?? "");
  const [postalCode, setPostalCode] = useState(customer?.postal_code ?? "");
  const [openBalance, setOpenBalance] = useState(customer?.open_balance ?? "");
  const [companyName, setCompanyName] = useState(customer?.company_name ?? "");
  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";


  async function handleCreateCustomer() {

    if (isViewMode) return;

    try{
      const response = await fetch("/api/customers",
        {
          method: "POST",

          headers: {
              "Content-Type":"application/json",
          },

          body: JSON.stringify({
            name,
            address,
            phone,
            email,
            notes,
            city,
            state,
            country,
            postalCode,
            openBalance,
            companyName
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push("/customers");
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function handleUpdateCustomer(){
    
    if (isViewMode) return;

    const response = await fetch(`/api/customers/${customer?.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":"application/json",
        },

        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          notes,
          city,
          state,
          country,
          postalCode,
          openBalance,
          companyName
        }),
      }
    );
    
    const result = await response.json();

    if (result.success) {
      router.push("/customers");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="form-card">

        {/* Customer Information */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title text-slate-500">
              Customer Information
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Name */}
            <div>
              <label className="form-label">
                Customer Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. John Smith"
                disabled={isViewMode}
              />
            </div>

            {/* Company */}
            <div>
              <label className="form-label">
                Company Name
              </label>

              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. ABC Enterprises"
                disabled={isViewMode}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">
                Phone
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. +1 246 555 1234"
                disabled={isViewMode}
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. customer@example.com"
                disabled={isViewMode}
              />
            </div>

          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Address */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title text-slate-500">
              Address
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Address */}
            <div className="col-span-2">
              <label className="form-label">
                Address
              </label>

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-textarea disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Street address"
                disabled={isViewMode}
              />
            </div>

            {/* City */}
            <div>
              <label className="form-label">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. Bridgetown"
                disabled={isViewMode}
              />
            </div>

            {/* State */}
            <div>
              <label className="form-label">
                State / Parish
              </label>

              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. Saint Michael"
                disabled={isViewMode}
              />
            </div>

            {/* Country */}
            <div>
              <label className="form-label">
                Country
              </label>

              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. Barbados"
                disabled={isViewMode}
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="form-label">
                Postal Code
              </label>

              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Postal code"
                disabled={isViewMode}
              />
            </div>

          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Account Information */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title text-slate-500">
              Account Information
            </h2>
          </div>

          <div className="space-y-6">

            {/* Open Balance */}
            <div className="max-w-sm">
              <label className="form-label">
                Open Balance
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  $
                </span>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openBalance}
                  onChange={(e) => setOpenBalance(e.target.value)}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 pl-7"
                  placeholder="0.00"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="form-label">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Add any notes about this customer..."
                disabled={isViewMode}
              />
            </div>

          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

          <button
            type="button"
            onClick={() => router.push("/customers")}
            className="form-secondary-button"
          >
            {isViewMode ? "Back" : "Cancel"}
          </button>


          {isViewMode && customer && (
            <button
              type="button"
              onClick={() => router.push(`/customers/${customer.id}/edit`)}
              className="form-primary-button"
            >
              Edit Customer
            </button>
          )}


          {isCreateMode && (
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="form-primary-button"
            >
              Create Customer
            </button>
          )} 

          {isEditMode && customer && (
            <button
              type="button"
              onClick={handleUpdateCustomer}
              className="form-primary-button"
            >
              Update Customer
            </button>
          )}

        </div>

      </div>
    </div>
  );
}