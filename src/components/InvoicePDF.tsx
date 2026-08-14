import React from "react";
import { Printer, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { Order } from "../types";

interface InvoicePDFProps {
  order: Order;
  onClose?: () => void;
}

export default function InvoicePDF({ order, onClose }: InvoicePDFProps) {
  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            भुगतान सफल (PAID)
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            सत्यापन लंबित (SUBMITTED)
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
            अस्वीकृत (REJECTED)
          </span>
        );
      default:
        return (
          <span className="bg-stone-100 text-stone-800 text-xs font-bold px-3 py-1 rounded-full border border-stone-200">
            लंबित (PENDING)
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-stone-300 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-lg print:border-none print:shadow-none print:p-0">
      {/* Top Header Actions (Hidden in print) */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-100 print:hidden">
        <h3 className="text-stone-800 font-bold text-lg">विज्ञापन भुगतान पावती / Invoice</h3>
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-all cursor-pointer"
            >
              वापस जाएँ
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            प्रिंट / PDF डाउनलोड
          </button>
        </div>
      </div>

      {/* Invoice Layout */}
      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-orange-600"></span>
              <span className="text-xl font-black text-stone-900 tracking-wider">परिचायिका</span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">
              Powered by Indian Press, Raipur
            </p>
            <p className="text-xs text-stone-400 mt-1">पता: गांधी नगर, पहाड़ी चौक, गुढ़ियारी, रायपुर (छ.ग.)</p>
          </div>
          <div className="md:text-right">
            <h2 className="text-2xl font-black text-stone-800 tracking-tight">INVOICE</h2>
            <p className="text-xs text-stone-500 mt-1">ऑर्डर ID: <span className="font-bold text-stone-800">{order.order_id}</span></p>
            <p className="text-xs text-stone-500">तिथि: {order.created_at ? new Date(order.created_at).toLocaleDateString("hi-IN") : new Date().toLocaleDateString("hi-IN")}</p>
          </div>
        </div>

        {/* Payment and Reference Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 border border-stone-200 rounded-xl p-5">
          <div>
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">बिल प्राप्तकर्ता (Customer Details)</h4>
            {order.items && order.items.length > 0 ? (
              <>
                <p className="text-sm font-bold text-stone-800">{order.items[0].customer_name}</p>
                <p className="text-xs text-stone-600 mt-1">फ़ोन: {order.items[0].customer_mobile}</p>
              </>
            ) : (
              <p className="text-sm text-stone-800">ग्राहक विवरण उपलब्ध नहीं</p>
            )}
          </div>

          <div className="md:border-l md:border-stone-200 md:pl-6">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">भुगतान की स्थिति</h4>
            <div className="flex flex-col gap-1.5 items-start">
              {getStatusBadge(order.payment_status)}
              {order.payment_ref && (
                <p className="text-xs text-stone-600 mt-1">
                  ट्रांजैक्शन संदर्भ (Ref ID): <span className="font-mono font-bold text-stone-800">{order.payment_ref}</span>
                </p>
              )}
              {order.payment_date && (
                <p className="text-xs text-stone-500">
                  भुगतान तिथि: {new Date(order.payment_date).toLocaleString("hi-IN")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemised Table */}
        <div>
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">विज्ञापन प्रविष्टियों का विवरण (Billing Items)</h4>
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200 text-xs font-bold text-stone-600">
                  <th className="px-4 py-3">क्रमांक</th>
                  <th className="px-4 py-3">विज्ञापन नंबर व विवरण</th>
                  <th className="px-4 py-3 text-right">दर (Price)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-stone-200 text-stone-800 bg-white">
                {order.items && order.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="px-4 py-3.5 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-stone-900">{it.ad_type === "matrimony" ? "विवाह परिचय प्रविष्टि" : "व्यवसाय विज्ञापन"}</p>
                      <p className="text-xs font-mono text-orange-700 font-semibold mt-1 bg-orange-50 inline-block px-1.5 py-0.5 rounded border border-orange-100">
                        {it.ad_number}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        पब्लिकेशन: {it.district_hi} • {it.sangathan_hi} • {it.magazine_hi} ({it.edition_hi})
                      </p>
                      <p className="text-[11px] text-stone-500">
                        आकार/लेआउट: {it.size_hi}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-900">
                      ₹{it.price.toLocaleString("en-IN")}.00
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 font-bold border-t border-stone-200 text-stone-800">
                  <td colSpan={2} className="px-4 py-3.5 text-right text-stone-600">कुल योग (Total):</td>
                  <td className="px-4 py-3.5 text-right text-base font-black text-orange-700 font-mono">
                    ₹{order.total_amount.toLocaleString("en-IN")}.00
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Indian Press Terms Disclaimer (Mandatory) */}
        <div className="border border-red-200 bg-red-50/50 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider block mb-1">आवश्यक सूचना / Disclaimer</span>
              <p className="text-xs text-red-700 leading-relaxed font-bold">
                १) आपके द्वारा उपलब्ध कराई गई जानकारी कृपया पुस्तक प्रकाशन के संपादक मंडल को जरूर प्रेषित करें एवं किसी भी त्रुटि सुधार हेतु संपादक मंडल को संपर्क करे
              </p>
              <p className="text-xs text-red-700 leading-relaxed font-bold mt-2">
                २) यह ऑनलाइन फॉर्म आपकी किसी भी त्रुटि के लिए बिल्कुल जिम्मेदार नहीं है
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-stone-200 text-center text-xs text-stone-400">
          <p className="font-semibold text-stone-500">परिचायिका - साहू समाज युवक-युवती परिचय सम्मेलन</p>
          <p className="mt-1">प्रकाशन कार्यालय: रायपुर (छ.ग.) • पूछताछ: 7647924636 / 9300717080 / 9301056006</p>
          <p className="mt-2 text-[10px] text-stone-300">यह एक कंप्यूटर जनित भुगतान रसीद है, हस्ताक्षर की आवश्यकता नहीं है।</p>
        </div>
      </div>
    </div>
  );
}
