"use client";

import { useState, useEffect, useCallback } from "react";

export interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  text: string;
  verified?: boolean;
  createdAt: string;
}

export interface SubmitReviewParams {
  rating: number;
  text: string;
  userName: string;
  userId: string;
  userAvatar?: string | null;
}

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(productId)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to load reviews (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (
      params: SubmitReviewParams
    ): Promise<{ success: boolean; error?: string }> => {
      if (!productId) {
        return { success: false, error: "Product ID missing" };
      }
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/reviews/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            rating: params.rating,
            text: params.text,
            userName: params.userName,
            userId: params.userId,
            userAvatar: params.userAvatar ?? null,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error || "Failed to submit review");
        }

        // Optimistically add review to local list
        const newReview: ReviewItem = {
          id: data.reviewId || `rev-${Date.now()}`,
          productId,
          userId: params.userId,
          userName: params.userName,
          userAvatar: params.userAvatar ?? null,
          rating: params.rating,
          text: params.text,
          verified: true,
          createdAt: new Date().toISOString(),
        };

        setReviews((prev) => [newReview, ...prev]);
        return { success: true };
      } catch (err: any) {
        const msg = err?.message || "Failed to submit review";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setSubmitting(false);
      }
    },
    [productId]
  );

  return {
    reviews,
    loading,
    submitting,
    error,
    fetchReviews,
    submitReview,
  };
}
