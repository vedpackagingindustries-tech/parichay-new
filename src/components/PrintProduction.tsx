import React, { useState } from "react";
import { Grid, Eye, Layers, Settings, FileSpreadsheet, Sparkles, Printer, Sliders } from "lucide-react";
import { Advertisement } from "../types";

interface PrintProductionProps {
  advertisements: Advertisement[];
}

export default function PrintProduction({ advertisements }: PrintProductionProps) {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSangathan, setSelectedSangathan] = useState("");
  const [selectedEdition, setSelectedEdition] = useState("");

  // Print Setup Options
  const [bleed, setBleed] = useState(0.125); // Bleed margin in inches
  const [safeArea, setSafeArea] = useState(0.25); // Safe area inside in inches
  const [columns, setColumns] = useState(2); // Columns for Matrimony tiles
  const [rows, setRows] = useState(5); // Rows for Matrimony tiles

  // Filter advertisements to only PAID ones that match selected filters
  const paidAds = advertisements.filter((ad) => {
    if (ad.payment_status !== "PAID") return false;
    if (selectedDistrict && ad.district_hi !== selectedDistrict) return false;
    if (selectedSangathan && ad.sangathan_hi !== selectedSangathan) return false;
    if (selectedEdition && ad.edition_hi !== selectedEdition) return false;
    return true;
  });

  const matrimonyAds = paidAds.filter((ad) => ad.type_code === "matrimony");
  const businessAds = paidAds.filter((ad) => ad.type_code === "business");

  // Get distinct filter values
  const uniqueDistricts = Array.from(new Set(advertisements.map((a) => a.district_hi)));
  const uniqueSangathans = Array.from(new Set(advertisements.map((a) => a.sangathan_hi)));
  const uniqueEditions = Array.from(new Set(advertisements.map((a) => a.edition_hi)));

  // Matrimony pagination tiling: total items per page is cols * rows
  const itemsPerPage = columns * rows;
  const pageCount = Math.ceil(matrimonyAds.length / itemsPerPage);

  const handlePrintProduction = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm print:hidden">
        <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-3">
          <h3 className="text-stone-800 font-bold text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-600" />
            मैगज़ीन प्रिंट-उत्पादन प्रबंधन (Print-Production Sheet Manager)
          </h3>
          <button
            onClick={handlePrintProduction}
            disabled={paidAds.length === 0}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            मुद्रित करें / PDF बनाएँ
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">जिला (District)</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">सभी जिला</option>
              {uniqueDistricts.map((d, idx) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">संगठन (Sangathan)</label>
            <select
              value={selectedSangathan}
              onChange={(e) => setSelectedSangathan(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">सभी संगठन</option>
              {uniqueSangathans.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">संस्करण (Edition)</label>
            <select
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">सभी संस्करण</option>
              {uniqueEditions.map((ed, idx) => (
                <option key={idx} value={ed}>{ed}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Print Layout Controls */}
        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-4 gap-4 bg-stone-50/50 p-4 rounded-lg">
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">ब्लीड मार्जिन (Bleed - inches)</label>
            <input
              type="number"
              step="0.01"
              value={bleed}
              onChange={(e) => setBleed(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">सुरक्षित क्षेत्र (Safe Area - inches)</label>
            <input
              type="number"
              step="0.01"
              value={safeArea}
              onChange={(e) => setSafeArea(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">परिचय ग्रिड कॉलम (Cols)</label>
            <select
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
              className="w-full px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs"
            >
              <option value={2}>2 कॉलम</option>
              <option value={3}>3 कॉलम</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">परिचय ग्रिड पंक्तियाँ (Rows)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Card */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
          <p className="text-xs font-semibold text-stone-700">
            प्रिंट होने के लिए तैयार प्रविष्टियां: <span className="text-orange-700 font-bold">{paidAds.length} प्रविष्टियां</span>
          </p>
        </div>
        <p className="text-xs text-stone-500">
          विवाह: {matrimonyAds.length} | व्यवसाय: {businessAds.length}
        </p>
      </div>

      {/* Print Production Render Sheets (1 Page = 8.5 x 11 inch) */}
      <div className="space-y-12">
        {/* Render Matrimony Pages in Grid Sheets */}
        {matrimonyAds.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-stone-700 mb-4 flex items-center gap-1.5 print:hidden">
              <Grid className="w-4 h-4 text-orange-600" />
              युवक-युवती परिचय प्रविष्टियां ({columns} × {rows} ग्रिड शीट)
            </h4>

            {Array.from({ length: pageCount }).map((_, pageIdx) => {
              const startIndex = pageIdx * itemsPerPage;
              const pageItems = matrimonyAds.slice(startIndex, startIndex + itemsPerPage);

              return (
                <div
                  key={pageIdx}
                  className="bg-white border border-stone-400 rounded-md p-6 max-w-[8.5in] min-h-[11in] mx-auto mb-8 shadow-md relative overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0 page-break-after"
                  style={{
                    padding: `${safeArea}in`,
                    boxSizing: "border-box"
                  }}
                >
                  {/* Trim/Registration marks for printers */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-stone-400 print:block"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-stone-400 print:block"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-stone-400 print:block"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-stone-400 print:block"></div>

                  {/* Page header (only visible in magazine print layout) */}
                  <div className="flex justify-between items-center text-[10px] text-stone-400 border-b border-stone-200 pb-1 mb-4">
                    <span className="font-bold uppercase tracking-widest text-stone-600">साहू समाज परिचायिका - युवक-युवती परिचय सम्मेलन</span>
                    <span>पेज नंबर: {pageIdx + 1}</span>
                  </div>

                  {/* Tiled Grid Layout */}
                  <div
                    className={`grid gap-4`}
                    style={{
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
                    }}
                  >
                    {pageItems.map((item, itemIdx) => {
                      const mat = item.matrimonyProfile;
                      return (
                        <div
                          key={item.id || itemIdx}
                          className="border border-stone-300 p-3 rounded bg-stone-50 flex gap-2.5 h-[1.8in] max-h-[1.8in] overflow-hidden relative"
                          style={{ boxSizing: "border-box" }}
                        >
                          {/* Photo Block */}
                          <div className="w-[1.2in] h-[1.5in] bg-stone-200 border border-stone-300 rounded overflow-hidden shrink-0">
                            {mat?.photo_url ? (
                              <img
                                src={mat.photo_url}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px] font-bold text-center">
                                फोटो उपलब्ध नहीं
                              </div>
                            )}
                          </div>

                          {/* Data block */}
                          <div className="flex-1 flex flex-col justify-between overflow-hidden">
                            <div>
                              <p className="text-[11px] font-black text-stone-900 border-b border-stone-200 pb-0.5 truncate">
                                {item.customer_name}
                              </p>
                              <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[7.5px] text-stone-600 leading-tight mt-1 overflow-hidden">
                                <p className="truncate"><span className="font-bold text-stone-800">जन्म:</span> {mat?.dob || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">ऊँचाई:</span> {mat?.height || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">गोत्र:</span> {mat?.gotra || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">रक्त:</span> {mat?.blood_group || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">पिता:</span> {mat?.father_name || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">पिता व्यव:</span> {mat?.father_occupation || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">माता:</span> {mat?.mother_name || "-"}</p>
                                <p className="truncate"><span className="font-bold text-stone-800">व्यवसाय:</span> {mat?.occupation || "-"}</p>
                                <p className="col-span-2 truncate"><span className="font-bold text-stone-800">शिक्षा:</span> {mat?.education || "-"}</p>
                                <p className="col-span-2 truncate"><span className="font-bold text-stone-800">पता:</span> {mat?.currentAddress || mat?.permanentAddress || "-"}</p>
                              </div>
                            </div>

                            {/* Contact info */}
                            <div className="border-t border-stone-200 pt-0.5 mt-0.5 flex justify-between items-center shrink-0">
                              <p className="text-[8px] font-black text-stone-950 font-mono">
                                फ़ोन: {item.customer_mobile1}
                              </p>
                              <p className="text-[7px] text-red-600 font-mono font-bold">
                                ID: {item.ad_number}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Page footer */}
                  <div className="absolute bottom-2 left-6 right-6 text-center text-[8px] text-stone-400">
                    * परिचायिका मुद्रण प्रति • गांधी नगर, रायपुर (छ.ग.)
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Render Business Pages */}
        {businessAds.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-stone-700 mb-4 flex items-center gap-1.5 print:hidden">
              <Eye className="w-4 h-4 text-orange-600" />
              व्यावसायिक विज्ञापन शीट्स
            </h4>

            {businessAds.map((item, idx) => {
              const bus = item.businessProfile;
              const design = bus?.adMakerDesignJson;

              return (
                <div
                  key={item.id || idx}
                  className="bg-white border border-stone-400 rounded-md p-6 max-w-[8.5in] min-h-[11in] mx-auto mb-8 shadow-md relative overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0 page-break-after"
                  style={{
                    padding: `${safeArea}in`,
                    boxSizing: "border-box"
                  }}
                >
                  <div className="flex justify-between items-center text-[10px] text-stone-400 border-b border-stone-200 pb-1 mb-4">
                    <span className="font-bold uppercase tracking-widest text-stone-600">साहू समाज परिचायिका - व्यवसाय विज्ञापन</span>
                    <span className="font-mono text-xs">ID: {item.ad_number}</span>
                  </div>

                  {/* Outer Bleed Lines */}
                  <div className="w-full h-[9in] flex items-center justify-center border border-dashed border-stone-300 rounded relative">
                    <span className="absolute -top-3 left-4 text-[9px] text-stone-400 bg-white px-1">प्रिंट ब्लीड गाइडलाइन ({bleed}in)</span>

                    {/* Standard Render Ad maker design if present */}
                    {design ? (
                      <div
                        className={`w-11/12 h-5/6 rounded border-solid ${design.backgroundColor || "bg-white"} ${design.borderColor || "border-stone-500"} ${design.borderWidth || "border-2"} ${design.padding || "p-4"}`}
                      >
                        {bus?.logo_url && (
                          <div className="flex justify-center mb-3">
                            <img src={bus.logo_url} alt="Logo" className="h-10 object-contain" />
                          </div>
                        )}
                        {design.elements?.map((el: any, i: number) => {
                          if (el.type === "divider") return <hr key={i} className="border-t border-dashed border-stone-300 my-2" />;
                          if (el.type === "offer_badge") {
                            return (
                              <div key={i} className="flex justify-center my-2">
                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">{el.content}</span>
                              </div>
                            );
                          }
                          return (
                            <div
                              key={i}
                              className={`text-center ${el.fontWeight === "bold" ? "font-bold" : ""} ${el.color || "text-stone-800"}`}
                              style={{ fontSize: "14px", marginTop: el.marginTop }}
                            >
                              {el.content}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Basic layout template render
                      <div className="w-11/12 h-5/6 border-4 border-stone-800 p-6 flex flex-col justify-between rounded bg-stone-50">
                        <div className="text-center">
                          <h2 className="text-3xl font-black text-stone-900">{bus?.business_name}</h2>
                          <p className="text-sm text-stone-500 mt-1">{bus?.category}</p>
                          <p className="text-stone-700 mt-4 leading-relaxed">{bus?.business_desc}</p>
                        </div>

                        {bus?.special_offer && (
                          <div className="flex justify-center">
                            <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm">
                              ऑफर: {bus.special_offer}
                            </span>
                          </div>
                        )}

                        <div className="text-center border-t border-stone-200 pt-4">
                          <p className="font-bold text-stone-800">संचालक: {bus?.owner_name}</p>
                          <p className="text-xl font-bold font-mono text-stone-900 mt-1">फ़ोन: {item.customer_mobile1}</p>
                          <p className="text-xs text-stone-500 mt-1">पता: {bus?.business_address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-6 right-6 text-center text-[8px] text-stone-400">
                    * साहू प्रेस रायपुर (छ.ग.) • प्रिंट विनिर्देशन: {item.size_hi}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {paidAds.length === 0 && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-12 text-center text-stone-400">
            <Sliders className="w-10 h-10 mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-semibold">चुने गए फ़िल्टर के अनुसार कोई स्वीकृत विज्ञापन नहीं मिला</p>
            <p className="text-xs mt-1">प्रिंट करने के लिए एडमिन डैशबोर्ड से भुगतान स्वीकृत करें।</p>
          </div>
        )}
      </div>
    </div>
  );
}
