"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { SupportedCurrency, getCurrencySymbol, getCurrencyFlag } from "@/lib/geo-detection";

interface CurrencyOption {
  value: SupportedCurrency;
  label: string;
  flag: string;
  searchTerms: string; // Additional search terms (country names, etc.)
}

const CURRENCY_OPTIONS: CurrencyOption[] = [
  // Americas
  { value: 'USD', label: 'USD - US Dollar', flag: '🇺🇸', searchTerms: 'united states america' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', flag: '🇨🇦', searchTerms: 'canada' },
  { value: 'BRL', label: 'BRL - Brazilian Real', flag: '🇧🇷', searchTerms: 'brazil' },
  { value: 'MXN', label: 'MXN - Mexican Peso', flag: '🇲🇽', searchTerms: 'mexico' },
  // Europe
  { value: 'EUR', label: 'EUR - Euro', flag: '🇪🇺', searchTerms: 'europe germany france italy spain' },
  { value: 'GBP', label: 'GBP - British Pound', flag: '🇬🇧', searchTerms: 'uk united kingdom england britain' },
  { value: 'CHF', label: 'CHF - Swiss Franc', flag: '🇨🇭', searchTerms: 'switzerland' },
  { value: 'SEK', label: 'SEK - Swedish Krona', flag: '🇸🇪', searchTerms: 'sweden' },
  { value: 'NOK', label: 'NOK - Norwegian Krone', flag: '🇳🇴', searchTerms: 'norway' },
  { value: 'DKK', label: 'DKK - Danish Krone', flag: '🇩🇰', searchTerms: 'denmark' },
  { value: 'PLN', label: 'PLN - Polish Zloty', flag: '🇵🇱', searchTerms: 'poland' },
  { value: 'CZK', label: 'CZK - Czech Koruna', flag: '🇨🇿', searchTerms: 'czech republic czechia' },
  { value: 'HUF', label: 'HUF - Hungarian Forint', flag: '🇭🇺', searchTerms: 'hungary' },
  { value: 'TRY', label: 'TRY - Turkish Lira', flag: '🇹🇷', searchTerms: 'turkey turkiye' },
  // Asia Pacific
  { value: 'INR', label: 'INR - Indian Rupee', flag: '🇮🇳', searchTerms: 'india' },
  { value: 'JPY', label: 'JPY - Japanese Yen', flag: '🇯🇵', searchTerms: 'japan' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', flag: '🇨🇳', searchTerms: 'china' },
  { value: 'SGD', label: 'SGD - Singapore Dollar', flag: '🇸🇬', searchTerms: 'singapore' },
  { value: 'AUD', label: 'AUD - Australian Dollar', flag: '🇦🇺', searchTerms: 'australia' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar', flag: '🇳🇿', searchTerms: 'new zealand' },
  { value: 'KRW', label: 'KRW - South Korean Won', flag: '🇰🇷', searchTerms: 'korea south korea' },
  { value: 'THB', label: 'THB - Thai Baht', flag: '🇹🇭', searchTerms: 'thailand' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit', flag: '🇲🇾', searchTerms: 'malaysia' },
  { value: 'PHP', label: 'PHP - Philippine Peso', flag: '🇵🇭', searchTerms: 'philippines' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah', flag: '🇮🇩', searchTerms: 'indonesia' },
  { value: 'VND', label: 'VND - Vietnamese Dong', flag: '🇻🇳', searchTerms: 'vietnam' },
  // Middle East
  { value: 'AED', label: 'AED - UAE Dirham', flag: '🇦🇪', searchTerms: 'uae emirates dubai' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', flag: '🇸🇦', searchTerms: 'saudi arabia' },
  { value: 'QAR', label: 'QAR - Qatari Riyal', flag: '🇶🇦', searchTerms: 'qatar' },
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar', flag: '🇰🇼', searchTerms: 'kuwait' },
  { value: 'BHD', label: 'BHD - Bahraini Dinar', flag: '🇧🇭', searchTerms: 'bahrain' },
  // Africa
  { value: 'ZAR', label: 'ZAR - South African Rand', flag: '🇿🇦', searchTerms: 'south africa' },
];

interface CurrencySelectorProps {
  value: SupportedCurrency;
  onValueChange: (value: SupportedCurrency) => void;
  className?: string;
}

export function CurrencySelector({ value, onValueChange, className }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Filter currencies based on search
  const filteredOptions = CURRENCY_OPTIONS.filter((option) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      option.value.toLowerCase().includes(searchLower) ||
      option.label.toLowerCase().includes(searchLower) ||
      option.searchTerms.toLowerCase().includes(searchLower)
    );
  });

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      highlighted?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onValueChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearch("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        break;
    }
  };

  const selectedOption = CURRENCY_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
          "hover:border-muted-foreground/30",
          isOpen && "ring-2 ring-ring/30 border-primary"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <span>{selectedOption?.flag}</span>
          <span>{value} - {getCurrencySymbol(value)}</span>
        </span>
        <Icon 
          icon="solar:alt-arrow-down-linear" 
          className={cn("h-4 w-4 opacity-50 shrink-0 transition-transform", isOpen && "rotate-180")} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-xl border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Icon 
                icon="solar:magnifer-linear" 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search currency or country..."
                className={cn(
                  "w-full h-9 pl-8 pr-3 rounded-lg text-sm",
                  "bg-muted/50 border-0",
                  "placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-0"
                )}
              />
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-[280px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No currency found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  data-highlighted={index === highlightedIndex}
                  onClick={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm",
                    "transition-colors cursor-pointer",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    option.value === value && "font-medium"
                  )}
                >
                  <span className="text-base">{option.flag}</span>
                  <span className="flex-1 text-left">{option.label}</span>
                  {option.value === value && (
                    <Icon icon="solar:checkmark-circle-linear" className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Keyboard hint */}
          <div className="p-2 border-t text-[10px] text-muted-foreground text-center">
            Type to search • ↑↓ to navigate • Enter to select
          </div>
        </div>
      )}
    </div>
  );
}
