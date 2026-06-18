import pool from "@/lib/db";
import ProductForm from "@/components/product_form";

export default async function EditproductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await pool.query(
    `
    SELECT *
    FROM products
    WHERE id = ?
    `,
    [id]
  );

  const product = rows[0];

  console.log(product);

  if (!product) {
    return <div>product not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Edit product
      </h1>

      <ProductForm mode={"edit"} product={product}/>
    </div>
  );
}