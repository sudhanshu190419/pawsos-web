"use client";

import { useState, useCallback } from "react";
import {
  Package,
  Truck,
  ExternalLink,
  Clock,
  MapPin,
  X,
  ChevronRight,
} from "lucide-react";
import type { Shipment } from "../lib/orders";
import {
  getTrackingStatusLabel,
  getTrackingStatusColor,
  getTrackingStepIndex,
  getTrackingTimelineSteps,
  isShipmentTerminal,
} from "../lib/orders";

/* ═══════════════════════════════════════════════════
   TRACKING MODAL
   ═══════════════════════════════════════════════════ */

const TrackingModal = ({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) => {
  const steps = getTrackingTimelineSteps();
  const currentStep = getTrackingStepIndex(shipment.shipmentStatus);
  const isCancelled =
    shipment.shipmentStatus === "cancelled" ||
    shipment.shipmentStatus === "cancelledByClient";
  const isRto =
    shipment.shipmentStatus === "rto" || shipment.shipmentStatus === "rtoDelivered";

  const handleTrackClick = useCallback(() => {
    if (shipment.trackingUrl) {
      window.open(shipment.trackingUrl, "_blank", "noopener,noreferrer");
    }
  }, [shipment.trackingUrl]);

  return (
    <div
      className="fixed inset-0 z-[100001] bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      style={{ animation: "trackingFadeIn 180ms ease-out" }}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "trackingSlideUp 280ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-indigo-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Track Shipment</h3>
              {shipment.brandName && (
                <p className="text-[10px] text-slate-400">{shipment.brandName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Courier & AWB Info */}
          <div className="grid grid-cols-2 gap-2.5">
            {shipment.courierName && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  Courier
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {shipment.courierName}
                </p>
              </div>
            )}
            {shipment.awbCode && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  AWB / Tracking
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">
                  {shipment.awbCode}
                </p>
              </div>
            )}
            {shipment.shipmentId && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  Shipment ID
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">
                  {shipment.shipmentId}
                </p>
              </div>
            )}
            {shipment.shiprocketOrderId && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  Order ID
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">
                  {shipment.shiprocketOrderId}
                </p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${getTrackingStatusColor(shipment.shipmentStatus)}`}
            >
              {getTrackingStatusLabel(shipment.shipmentStatus)}
            </span>
            {!isShipmentTerminal(shipment.shipmentStatus) && shipment.awbCode && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                In progress
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-100" />

            <div className="space-y-0 relative">
              {steps.map((step, idx) => {
                const completed = idx <= currentStep && !isCancelled && !isRto;
                const active = idx === currentStep && !isCancelled && !isRto;

                // For RTO, mark all steps as greyed out
                const isStepActive =
                  isRto
                    ? false
                    : isCancelled
                    ? idx === 0
                    : completed;
                const isStepCurrent = active;

                let icon = null;
                if (completed && !isCancelled && !isRto) {
                  if (idx < currentStep) {
                    icon = (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    );
                  } else {
                    icon = (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    );
                  }
                } else if (isCancelled && idx === 0) {
                  icon = (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  );
                } else if (isRto && idx === steps.length - 1) {
                  icon = (
                    <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                  );
                } else {
                  icon = (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  );
                }

                return (
                  <div key={step.key} className="flex items-start gap-3 py-2.5">
                    <div
                      className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isStepCurrent
                          ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200 scale-110"
                          : isStepActive
                          ? "bg-emerald-500 text-white"
                          : isCancelled && idx === 0
                          ? "bg-red-500 text-white"
                          : isRto && idx === steps.length - 1
                          ? "bg-rose-100 text-rose-600"
                          : "bg-slate-50 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {icon}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-sm font-semibold ${
                          isStepCurrent
                            ? "text-indigo-600"
                            : isStepActive
                            ? "text-slate-900"
                            : isCancelled && idx === 0
                            ? "text-red-600"
                            : isRto && idx === steps.length - 1
                            ? "text-rose-600"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                        {isStepCurrent && (
                          <span className="ml-2 inline-flex items-center text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                            In Progress
                          </span>
                        )}
                      </p>
                      {isStepActive && idx === currentStep && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {shipment.courierName
                            ? `Handed over to ${shipment.courierName}`
                            : "Processing your shipment"}
                        </p>
                      )}
                      {idx === 0 && isStepActive && currentStep === 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Your order has been placed and is awaiting pickup
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RTO note */}
          {isRto && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-rose-700">Return to Origin</p>
                <p className="text-[10px] text-rose-500 mt-0.5">
                  This shipment is being returned to the seller.
                </p>
              </div>
            </div>
          )}

          {/* Cancelled note */}
          {isCancelled && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">Shipment Cancelled</p>
                <p className="text-[10px] text-red-500 mt-0.5">
                  This shipment has been cancelled.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-3 border-t border-slate-100">
          {shipment.trackingUrl ? (
            <button
              onClick={handleTrackClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
              Track with {shipment.courierName || "Courier"}
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-medium">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Tracking will be available once courier is assigned
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes trackingFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes trackingSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SHIPMENT TRACKING CARD
   ═══════════════════════════════════════════════════ */

interface ShipmentTrackingCardProps {
  shipment: Shipment;
  /** Optional override for display name (defaults to shipment.brandName) */
  brandName?: string;
  /** Optional shipment index for fallback naming */
  shipmentIndex?: number;
  /** Compact mode — fewer details, suitable for multi-shipment lists */
  compact?: boolean;
}

export default function ShipmentTrackingCard({
  shipment,
  brandName,
  shipmentIndex,
  compact,
}: ShipmentTrackingCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const displayName = brandName || shipment.brandName || `Shipment ${(shipmentIndex ?? 0) + 1}`;

  const handleTrackClick = useCallback(() => {
    if (shipment.trackingUrl) {
      window.open(shipment.trackingUrl, "_blank", "noopener,noreferrer");
    }
  }, [shipment.trackingUrl]);

  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const hasTracking = !!(shipment.trackingUrl && shipment.awbCode);

  if (compact) {
    return (
      <>
        <div className="rounded-xl bg-indigo-50/40 border border-indigo-100/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-indigo-600">
                  {displayName.charAt(0)}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {displayName}
              </p>
            </div>
            {shipment.shipmentStatus && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${getTrackingStatusColor(shipment.shipmentStatus)}`}
              >
                {getTrackingStatusLabel(shipment.shipmentStatus)}
              </span>
            )}
          </div>

          {shipment.awbCode && (
            <p className="text-[9px] text-slate-500 font-mono mb-2">
              AWB: {shipment.awbCode}
            </p>
          )}

          <div className="flex items-center gap-2">
            {hasTracking ? (
              <>
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Truck className="w-3 h-3" strokeWidth={2} />
                  Details
                </button>
                <button
                  onClick={handleTrackClick}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3 h-3" strokeWidth={2} />
                  Track
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-amber-600 bg-amber-50 rounded-lg">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                Awaiting courier assignment
              </div>
            )}
          </div>
        </div>

        {modalOpen && <TrackingModal shipment={shipment} onClose={handleCloseModal} />}
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-indigo-600" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{displayName}</p>
              {shipment.courierName && (
                <p className="text-[10px] text-slate-400">{shipment.courierName}</p>
              )}
            </div>
          </div>
          {shipment.shipmentStatus && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${getTrackingStatusColor(shipment.shipmentStatus)}`}
            >
              {getTrackingStatusLabel(shipment.shipmentStatus)}
            </span>
          )}
        </div>

        {/* AWB Info */}
        {shipment.awbCode ? (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-slate-100 mb-3">
            <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-slate-400 font-medium">Tracking Number (AWB)</p>
              <p className="text-xs font-mono font-bold text-slate-800 truncate">
                {shipment.awbCode}
              </p>
            </div>
            {shipment.courierName && (
              <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md flex-shrink-0">
                {shipment.courierName}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-[11px] text-amber-700 font-medium">
              Tracking will be available once courier is assigned.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasTracking && (
            <>
              <button
                onClick={handleOpenModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex-1"
              >
                <Truck className="w-3.5 h-3.5" strokeWidth={2} />
                Track Order
              </button>
              <button
                onClick={handleTrackClick}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex-1"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                Open Courier Site
              </button>
            </>
          )}
          {!shipment.awbCode && (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Tracking will be available once courier is assigned
            </div>
          )}
          {shipment.awbCode && !shipment.trackingUrl && (
            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex-1"
            >
              <Truck className="w-3.5 h-3.5" strokeWidth={2} />
              View Tracking Details
            </button>
          )}
        </div>
      </div>

      {modalOpen && <TrackingModal shipment={shipment} onClose={handleCloseModal} />}
    </>
  );
}
