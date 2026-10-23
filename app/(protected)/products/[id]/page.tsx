import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProductForm from "@/components/forms/product_form";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

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
    <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
        Edit product
        </h1>
        <ProductForm mode={"view"} product={product}/>
    </div>
  );
}