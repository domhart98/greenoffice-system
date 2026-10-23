import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get("period") || "last_month";
    const startDate = req.nextUrl.searchParams.get("start_date");
    const endDate = req.nextUrl.searchParams.get("end_date");

    let dateStart: string;
    let dateEnd: string;

    const today = new Date();

    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    if (period === "custom") {
      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Custom date range requires a start and end date.",
          },
          { status: 400 }
        );
      }

      dateStart = startDate;
      dateEnd = endDate;

    } else if (period === "last_month") {

      const firstDayThisMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      const lastDayLastMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );

      const firstDayLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );

      dateStart = formatDate(firstDayLastMonth);
      dateEnd = formatDate(lastDayLastMonth);

    } else if (period === "last_3_months") {

      const firstDay = new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1
      );

      dateStart = formatDate(firstDay);
      dateEnd = formatDate(today);

    } else if (period === "last_6_months") {

      const firstDay = new Date(
        today.getFullYear(),
        today.getMonth() - 5,
        1
      );

      dateStart = formatDate(firstDay);
      dateEnd = formatDate(today);

    } else if (period === "year_to_date") {

      const firstDayOfYear = new Date(
        today.getFullYear(),
        0,
        1
      );

      dateStart = formatDate(firstDayOfYear);
      dateEnd = formatDate(today);

    } else if (period === "this_year") {

      const firstDayOfYear = new Date(
        today.getFullYear(),
        0,
        1
      );

      dateStart = formatDate(firstDayOfYear);
      dateEnd = formatDate(today);

    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid period.",
        },
        { status: 400 }
      );
    }

    const [incomeRows]: any = await pool.query(
      `
        SELECT COALESCE(SUM(total), 0) AS income
        FROM invoices
        WHERE invoice_date BETWEEN ? AND ?
      `,
      [dateStart, dateEnd]
    );

    const [expenseRows]: any = await pool.query(
      `
        SELECT COALESCE(SUM(total), 0) AS expenses
        FROM expenses
        WHERE expense_date BETWEEN ? AND ?
      `,
      [dateStart, dateEnd]
    );

    const income = Number(incomeRows[0]?.income || 0);
    const expenses = Number(expenseRows[0]?.expenses || 0);
    const netProfit = income - expenses;

    return NextResponse.json({
      success: true,
      period,
      startDate: dateStart,
      endDate: dateEnd,
      income,
      expenses,
      netProfit,
    });

  } catch (error) {
    console.error("Profit & Loss error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate profit and loss.",
      },
      { status: 500 }
    );
  }
}