"use client";

import { useRouter } from "next/navigation";

export default function UpdateStatusBtn({status, invoice_number}:{status: string, invoice_number:number}){
    const router = useRouter();
    
    async function handleStatusUpdateBtnClick() {
        const response = await fetch(
            `/api/invoices/${invoice_number}/status`, 
            {
                method: "PATCH",
                headers: {
                    "Content-Type":"application/json",
                },
                body: JSON.stringify({
                    status: "DRAFT",
                }),
            }
        );

        const data = await response.json();

        console.log(data);

        if(response.ok) {
            router.refresh();
        }
        else {
            console.log("Could not update status.");
        }

    }


    return(
        <div>
            <button className="text-md text-white bg-blue-600 p-4" onClick={handleStatusUpdateBtnClick}>
                Change invoice status to 'DRAFT'
            </button>
        </div>
    )
}