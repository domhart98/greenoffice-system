
<div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-xl font-bold mb-4">
        Low Stock Items
    </h2>

    <table className="w-full">

        <thead>
            <tr>
                <th>Product</th>
                <th>Stock</th>
            </tr>
        </thead>

        <tbody>

            {data.lowStockProducts.map((product:any) => (

                <tr key={product.id}>
                    <td>{product.name}</td>

                    <td>

                        {product.stock_quantity === 0 ? (

                            <span className="
                                bg-red-100
                                text-red-700
                                px-2 py-1
                                rounded-full
                            ">
                                OUT
                            </span>

                        ) : (

                            <span className="
                                bg-yellow-100
                                text-yellow-700
                                px-2 py-1
                                rounded-full
                            ">
                                {product.stock_quantity}
                            </span>

                        )}

                    </td>
                </tr>

            ))}

        </tbody>

    </table>
</div>