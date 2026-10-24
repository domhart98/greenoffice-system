"use client";

import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import LoadingSpinner from "@/components/loading_spinner";
import { useRouter } from "next/navigation";
import ConfirmDialogue from "@/components/ui/confirm_dialogue";
import toast from "react-hot-toast";
import { stringify } from "querystring";
import { User } from "@/types/user";
import { Plus } from "lucide-react";
import DataTableFilter from "@/components/data-table/data_table_filter";

export default function UsersPage() {

    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [userToDelete, setuserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const filters = useMemo(
        () => [
          {
            key: "role" as keyof User,
            value: role,
          },
        ],
        [role]
      );
    const table = useDataTable(
      users, 
      20,
      [
        "invoice_number",
        "customer_name",
      ],
      filters,
    );

    const columns: Column<(typeof users)[number]>[] = [
      {
        key: "id",
        header: "ID"
      },
      {
        key: "username",
        header: "Username",
        sortable: true,
      },
      {
        key: "role",
        header: "Role"
      }
      ,
      {
        key: "email",
        header: "Email"
      }
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch(
            `/api/users`
            );
        

        const data = await response.json();

        setUsers(data);
        setLoading(false);
        };

        fetchUsers();
    },[]);

    const roleOptions = useMemo(() => {
          const values = users
            .map((user: User) => user.role)
            .filter(Boolean);
      
          return [...new Set(values)]
            .sort()
            .map((value) => ({
              value: String(value),
              label: String(value),
            }));
    }, [users]);

    const handleRoleChange = (value: string) => {
        setRole(value);
        table.setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setRole("");
        table.setSearch("");
        table.setCurrentPage(1);
    }

    const handleSearchChange = (value: string) => {
        table.setSearch(value);
        table.setCurrentPage(1);
    };

    const handleView = (user: User) => {
    router.push(`/users/${user.id}`);
    };

    const handleEdit = (user: User) => {
        router.push(`/users/${user.id}/edit`);
    };

    const handleDelete = async () => {
    try{
        setIsDeleting(true);

        await fetch(`/api/users/${userToDelete!.id}`, {
        method: "DELETE",
        });

        setUsers((prev) =>
        prev.filter(
            (user:any) => user.id !== userToDelete!.id
        )
        );

        setuserToDelete(null);
        setIsDeleting(false);

    } catch (error) {
        console.log(error);
        toast.error("Failed to Delete user.");
    }  
    }; 

    if (loading) {
      return <LoadingSpinner/>;
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 px-6 pt-6 pb-4">
                <h1 className="text-2xl font-bold mb-6">
                    Users
                </h1>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <DataTableToolbar 
                    search={table.search} 
                    onSearchChange={handleSearchChange}
                    onClearFilters={handleClearFilters}
                    filters={
                        <DataTableFilter
                            value={role}
                            onChange={handleRoleChange}
                            placeholder="Role"
                            options={roleOptions}
                        />
                    }
                    actions={
                        <Link href="/users/new"
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
                            <Plus size={16} strokeWidth={2} />
                            Add user
                        </Link>
                    }
                /> 
                
                <DataTable data={table.paginatedData} 
                        columns={columns} 
                        rowKey={"id"} 
                        sortColumn={table.sortColumn as string} 
                        sortDirection={table.sortDirection} 
                        onSort={(column) => table.handleSort(column as keyof User)} 
                        onEdit={handleEdit} 
                        onDelete={(user) => setuserToDelete(user)}
                        onView={handleView} />
        
                <DataTablePagination currentPage={table.currentPage} totalPages={table.totalPages} onPageChange={table.setCurrentPage}></DataTablePagination>

              </div>
                
                <ConfirmDialogue
                    open={userToDelete !== null}
                    title="Delete user"
                    message={
                        userToDelete
                            ? `Are you sure you want to delete "${userToDelete.username}"? This action cannot be undone.`
                            : ""
                    }
                    loading={isDeleting}
                    onCancel={() => setuserToDelete(null)}
                    onConfirm={handleDelete}
                />
            </div>
        </div>
    );
}