import { InvoiceData } from "@/types/invoice";
import Image from "next/image";
import PrintButton from "./print_button";

type Props = {
  invoice: InvoiceData;
};

export default function InvoicePreview({ invoice }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-10 bg-white text-black">
      <h1 className="text-center text-3xl">Tax Invoice</h1>
      <h4 className="text-center text-md">VAT Registration # 6709227059</h4>
      <div className="flex justify-between my-8">
        <div className="text-xs">
          <Image src="/images/icons/greenoffice-logo.webp" alt="green office logo" width={240} height={240}/>
          <p className="text-md">7 Bannatyne Gardens</p>
          <p className="text-md">Christ Church</p>
          <p className="text-md">Barbados</p>
          <p className="text-md">Tele: 832-1255</p>
          <p className="text-md">Email: <span className="text-blue-500 underline">greenofficebarbados@gmail.com</span></p>
          <p className="text-md">Website: <span className="text-blue-500 underline">greenofficebarbados.com</span></p>
        </div>

        <div className="text-left p-2 text-xs">
          <p>
            <strong>Invoice #:</strong>{" "}
            {invoice.invoiceNumber}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(invoice.invoiceDate).toLocaleDateString()}
          </p>

          <p>
            <strong>Terms:</strong>{" "}
            {invoice.terms}
          </p>
        </div>
      </div>

      <div className="mb-8 w-fit">
        <h2 className="font-bold mb-2">
          Bill To
        </h2>
        <div className="p-2 border border-solid text-xs">
          <p>{invoice.customerName}</p>
          <p className="whitespace-pre-line">
            {invoice.customerAddress}
          </p>
        </div>
        
      </div>

      <table className="w-full border-collapse border mb-8">
        <thead className="text-lg">
          <tr>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Amount</th>
          </tr>
        </thead>

        <tbody className="text-sm">
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td className="border p-2">
                {item.quantity}
              </td>

              <td className="border p-2">
                {item.description}
              </td>

              <td className="border p-2 text-right">
                ${Number(item.rate).toFixed(2)}
              </td>

              <td className="border p-2 text-right">
                $
                {(
                  item.quantity * item.rate
                ).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-72 space-y-2 border border-solid text-sm">

          <div className="flex justify-between px-2 pt-1">
            <span>Subtotal</span>
            <span>
              ${Number(invoice.subtotal).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between px-2">
            <span>VAT (17.5%)</span>
            <span>
              ${Number(invoice.vat).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-xl border-t pt-2 px-2">
            <span>Total</span>
            <span>
              ${Number(invoice.total).toFixed(2)}
            </span>
          </div>

        </div>
      </div>
      <p className="text-xs">Thank you for your business and have a great day!</p>
      <p className="text-xs">PLEASE MAKE CHEQUES PAYABLE TO GREEN OFFICE</p>
      <p className="text-xs mb-6">Return cheques will incur a charge of $50.00</p>

      <PrintButton/>
    </div>
  );
}