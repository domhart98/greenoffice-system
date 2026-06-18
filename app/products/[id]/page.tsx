import pool from "@/lib/db";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [productRows] = await pool.query(
    `
    SELECT *
    FROM products
    WHERE id = ?
    `,
    [id]
  );

  const product = (productRows as any[])[0];

  if (!product) {
    return (
      <div className="p-6">
        Product not found
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg  border bg-white shadow-sm p-4">
        <h3 className="font-semibold text-lg mb-3">
        Product Details
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
            <div className="text-gray-500">
            Name
            </div>

            <div>
            {product.name}
            </div>
        </div>

        <div>
            <div className="text-gray-500">
            SKU
            </div>

            <div>
            {product.sku}
            </div>
        </div>

        <div className="col-span-2">
            <div className="text-gray-500">
            Price
            </div>

            <div className="whitespace-pre-line">
            {product.price}
            </div>
        </div>

        <div>
            <div className="text-gray-500">
            VAT Rate
            </div>

            <div>
            {product.vat_rate}
            </div>
        </div>
        <div>
            <div className="text-gray-500">
            Is Active
            </div>

            <div>
            {product.is_active}
            </div>
        </div>
        <div>
            <div className="text-gray-500">
            Created On
            </div>

            <div>
              {new Date(product.created_at).toLocaleDateString()}
            </div>
        </div>
      </div>
    </div>
  );
}