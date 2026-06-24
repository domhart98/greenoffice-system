import pool from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  const body = await req.json();
  const { invoiceNumber } = await params;

  console.log("Body: ", body);

  const validStatuses = [
    "DRAFT",
    "SENT",
    "PAID",
    "VOID",
  ];

  if (!validStatuses.includes(body.status)) {
    return Response.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  const [invoiceRows] = await pool.query(
    `
    SELECT *
    FROM invoices
    WHERE invoice_number = ?
    `,
    [invoiceNumber]
  );

  const invoice = (invoiceRows as any[])[0];

  if (!invoice) {
    return Response.json(
      { error: "Invoice not found" },
      { status: 404 },
    );
  }

  const oldStatus = invoice.status;

  if (
    oldStatus !== "SENT" &&
    body.status === "SENT"
  ) {
    // Retrieve invoice items
    const [items]: any = await pool.query(
      `
      SELECT
        product_id,
        quantity
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [invoice.id]
    );

    // Check stock availability
    for (const item of items) {

      const [productRows]: any = await pool.query(
        `
        SELECT
          name,
          stock_quantity
        FROM products
        WHERE id = ?
        `,
        [item.product_id]
      );

      const product = productRows[0];

      if (!product) {
        return Response.json(
          {
            success: false,
            error: "Product not found"
          },
          { 
            status: 404 
          }
        );
      }
      else if (product.stock_quantity < item.quantity) {
        return Response.json(
          {
            success: false,
            error:
              `${product.name} only has ` +
              `${product.stock_quantity} units available`
          },
          { status: 400 }
        );
      }
      else {
        await pool.query(
          `
          UPDATE products
          SET stock_quantity =
              stock_quantity - ?
          WHERE id = ?
          `,
          [
            item.quantity,
            item.product_id
          ]
        );
      }
    }
  }

  if (
    oldStatus === "SENT" &&
    (
      body.status === "VOID" ||
      body.status === "DRAFT"
    )
  ) {
    const [invoiceRows]: any = await pool.query(
      `
      SELECT id
      FROM invoices
      WHERE invoice_number = ?
      `,
      [invoiceNumber]
    );

    const invoiceId = invoiceRows[0].id;

    const [items]: any = await pool.query(
      `
      SELECT
        product_id,
        quantity
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [invoiceId]
    );

    for (const item of items) {

      await pool.query(
        `
        UPDATE products
        SET stock_quantity =
          stock_quantity + ?
        WHERE id = ?
        `,
        [
          item.quantity,
          item.product_id
        ]
      );
    }
  }
  
  const validTransitions = {
    DRAFT: ["SENT", "VOID"],
    SENT: ["PAID", "VOID", "DRAFT"],
    PAID: [],
    VOID: [],
  };

  if (
    !validTransitions[
      invoice.status as keyof typeof validTransitions
    ].includes(body.status)
  ) {
    return Response.json(
      {
        error: `Cannot change invoice from ${invoice.status} to ${body.status}`,
      },
      { status: 400 }
    );
  }

  await pool.query(
    `
    UPDATE invoices
    SET status = ?
    WHERE invoice_number = ?
    `,
    [body.status, invoiceNumber]
  );

  return Response.json({
    status: body.status,
    invoice_number: invoiceNumber,
    success: true,
    message: `Status changed from ${invoice.status} to ${body.status}`,
  });
}