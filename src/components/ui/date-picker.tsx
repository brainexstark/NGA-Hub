"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getDaysInMonth, setYear, setMonth, setDate as setDay } from "date-fns"

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DatePicker({ date, setDate }: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  // List of years from current year down to 1900
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  const selectedYear = date ? date.getFullYear() : undefined;
  const selectedMonth = date ? date.getMonth() : undefined;
  const selectedDay = date ? date.getDate() : undefined;

  // Calculate days in month based on selected year/month to handle 28/29/30/31 days correctly
  const daysInMonth = (selectedYear !== undefined && selectedMonth !== undefined)
    ? getDaysInMonth(new Date(selectedYear, selectedMonth)) 
    : 31;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    const baseDate = date || new Date();
    const updatedDate = setYear(baseDate, newYear);
    
    // Safety check: if moving from a leap year Feb 29 to a non-leap year, adjust day
    const maxDays = getDaysInMonth(updatedDate);
    if (updatedDate.getDate() > maxDays) {
      setDate(setDay(updatedDate, maxDays));
    } else {
      setDate(updatedDate);
    }
  };

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = parseInt(monthIndex);
    const baseDate = date || new Date();
    const updatedDate = setMonth(baseDate, newMonth);

    // Safety check for months with fewer days
    const maxDays = getDaysInMonth(updatedDate);
    if (updatedDate.getDate() > maxDays) {
      setDate(setDay(updatedDate, maxDays));
    } else {
      setDate(updatedDate);
    }
  };

  const handleDayChange = (day: string) => {
    const newDay = parseInt(day);
    const baseDate = date || new Date();
    setDate(setDay(baseDate, newDay));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex-1 min-w-[120px]">
        <Select
          value={selectedMonth?.toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[80px]">
        <Select
          value={selectedDay?.toString()}
          onValueChange={handleDayChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[100px]">
        <Select
          value={selectedYear?.toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
