"use client";

import { useEffect, useState } from "react";
import PaginationControls from "@/components/common/PaginationControls";
import { cancelMyOrder, getMyOrdersPage, getOrderDetails } from "@/lib/actions/action";
import type { Order } from "@/lib/data";
import Image from "next/image";
import { getShipmentByOrderId, type Shipment } from "@/lib/actions/shipping";
import { toast } from "sonner";
import Skeleton from "@/components/Loaders/Skeleton";

const DEFAULT_PAGE_SIZE = 10;

function OrdersListSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex space-x-2 ml-4">
            {Array.from({ length: 3 }).map((__, j) => (
              <Skeleton key={j} className="h-16 w-16 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderDetailsSkeleton() {
  return (
    <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
      <Skeleton className="h-6 w-56 mb-4" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-5 w-28 mb-2" />
      <div className="border border-gray-100 rounded p-3 bg-gray-50 mb-4 space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-5 w-24 mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-100 p-2 rounded bg-gray-50">
            <Skeleton className="h-24 w-24 rounded mb-2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const refreshOrders = async () => {
    setRefreshing(true);
    try {
      const data = await getMyOrdersPage(page, pageSize);
      if (!data) {
        setOrders([]);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      if (data.total > 0 && data.items.length === 0 && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setOrders(data.items || []);
      setPage(data.page);
      setPageSize(data.pageSize);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setOrders([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refreshOrders();
  }, [page, pageSize]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;

      if (selectedOrder?.id) {
        handleViewDetails(String(selectedOrder.id));
        return;
      }

      refreshOrders();
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedOrder?.id, page, pageSize]);

  const handleViewDetails = async (orderNumber: string) => {
    setDetailsLoading(true);
    try {
      const data = await getOrderDetails(orderNumber);
      setSelectedOrder(data);

      if (data?.id) {
        const shipment = await getShipmentByOrderId(data.id);
        setSelectedShipment(shipment);
      } else {
        setSelectedShipment(null);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const canCancel =
    !!selectedOrder &&
    selectedOrder.status !== "PAID" &&
    selectedOrder.status !== "CANCELLED" &&
    selectedOrder.status !== "REFUNDED";

  if (!orders)
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <OrdersListSkeleton />
      </div>
    );
  if (orders.length === 0) return <p className="text-sm text-gray-500">No orders found.</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">My Orders</h2>
        <button
          type="button"
          className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          onClick={() => {
            if (selectedOrder?.id) handleViewDetails(String(selectedOrder.id));
            else refreshOrders();
          }}
          disabled={refreshing || detailsLoading}
        >
          {refreshing || detailsLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!selectedOrder && (
        <>
        <div className="flex flex-col space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer bg-white transition"
              onClick={() => handleViewDetails(order.id.toString())}
            >
              <div className="flex-1 text-gray-700 text-sm space-y-1">
                <p><span className="font-medium">Order:</span> #{order.id}</p>
                <p><span className="font-medium">Status:</span> <span className="text-blue-600">{order.status}</span></p>
                <p><span className="font-medium">Placed on:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Total:</span> â‚¹{order.totalAmount.toLocaleString()}</p>
                <p><span className="font-medium">Ship To:</span> {order.deliveryName}</p>
              </div>

              <div className="flex space-x-2 ml-4">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.productId}
                    className="relative w-16 h-16 overflow-hidden rounded bg-gray-50"
                  >
                    <Image
                      src={item.image || "/fallback.png"}
                      alt={item.name || "Product"}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded text-gray-600 text-xs font-semibold">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          currentCount={orders.length}
          itemLabel="orders"
          isLoading={refreshing}
          onPageChange={(nextPage) => setPage(nextPage)}
          onPageSizeChange={(nextPageSize) => {
            setPage(1);
            setPageSize(nextPageSize);
          }}
        />
        </>
      )}

      {selectedOrder && (
        <div>
          <button
            className="mb-4 px-4 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded transition"
            onClick={() => {
              setSelectedOrder(null);
              setSelectedShipment(null);
            }}
          >
            â† Back to Orders
          </button>

          {detailsLoading ? (
            <OrderDetailsSkeleton />
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Order Details: #{selectedOrder.id}</h3>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Order Status:</span>{" "}
                  <span className="text-blue-600">{selectedOrder.status}</span>
                </p>
                {canCancel && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded border border-red-200 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                    disabled={cancelling}
                    onClick={async () => {
                      const ok = confirm(`Cancel order #${selectedOrder.id}?`);
                      if (!ok) return;

                      setCancelling(true);
                      try {
                        const res = await cancelMyOrder(selectedOrder.id);
                        if (res.success) {
                          toast.success("Order cancelled");
                          await handleViewDetails(String(selectedOrder.id));
                          await refreshOrders();
                        } else {
                          toast.error(res.message || "Cancel failed");
                        }
                      } finally {
                        setCancelling(false);
                      }
                    }}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
              <div className="text-gray-700 text-sm mb-4 space-y-1">
                <p><span className="font-medium">Placed on:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Ship To:</span> {selectedOrder.deliveryName}</p>
                <p><span className="font-medium">Total Amount:</span> â‚¹{selectedOrder.totalAmount.toLocaleString()}</p>
              </div>

              <h4 className="text-lg font-medium mb-2 text-gray-800">Shipping</h4>
              <div className="border border-gray-100 rounded p-3 bg-gray-50 text-sm text-gray-700 mb-4 space-y-1">
                {selectedShipment ? (
                  <>
                    <p><span className="font-medium">Status:</span> {selectedShipment.status}</p>
                    <p><span className="font-medium">Courier:</span> {selectedShipment.courier}</p>
                    <p><span className="font-medium">Tracking Number:</span> {selectedShipment.trackingNumber ?? "N/A"}</p>
                  </>
                ) : (
                  <p className="text-gray-600">Shipment status will appear once your order is shipped.</p>
                )}
              </div>

              <h4 className="text-lg font-medium mb-2 text-gray-800">Products</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.productId} className="border border-gray-100 p-2 rounded flex flex-col items-center bg-gray-50 text-sm">
                    <div className="relative w-24 h-24 overflow-hidden rounded bg-white mb-2">
                      <Image
                        src={item.image || "/fallback.png"}
                        alt={item.name || "Product"}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <p className="text-center font-medium">{item.name}</p>
                    <p className="font-semibold text-blue-600 mt-1">â‚¹{item.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
