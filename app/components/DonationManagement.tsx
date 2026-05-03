"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

type Campaign = {
  id: string;
  title: string;
  description: string;
  image: string;
  goalAmount: number;
  raisedAmount: number;
  timeLeft: string;
  active: boolean;
};

type Donation = {
  id: string;
  userId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  amount: number;
  paymentId: string;
  createdAt: any;
};

export default function DonationManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<any>(null);
  const [goalAmount, setGoalAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const [totalRaised, setTotalRaised] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "donation_campaigns"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];

      setCampaigns(list);

      const total = list.reduce(
        (sum, campaign) => sum + (campaign.raisedAmount || 0),
        0
      );

      setTotalRaised(total);
    });

    return () => unsubscribe();
  }, []);

  const createCampaign = async () => {
    if (!title || !description || !image || !goalAmount || !timeLeft) {
      alert("Please fill all fields");
      return;
    }

    try {
  const storage = getStorage();

  const imageRef = ref(
    storage,
    `campaigns/${Date.now()}_${image.name}`
  );

  await uploadBytes(imageRef, image);

  const imageUrl = await getDownloadURL(imageRef);

  await addDoc(collection(db, "donation_campaigns"), {
    title,
    description,
    image: imageUrl,
    goalAmount: Number(goalAmount),
    raisedAmount: 0,
    timeLeft,
    active: true,
    createdAt: serverTimestamp(),
  });

  setTitle("");
  setDescription("");
  setImage(null);
  setGoalAmount("");
  setTimeLeft("");
} catch (error) {
  console.error(error);
  alert("Failed to create campaign");
}
  };

  const deleteCampaign = async (id: string) => {
    const confirmDelete = confirm("Delete this campaign?");

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "donation_campaigns", id));
  };

  const loadDonations = async (campaignId: string) => {
    setSelectedCampaign(campaignId);

    const q = query(
      collection(db, "donations"),
      where("campaignId", "==", campaignId)
    );

    const snapshot = await getDocs(q);

    const donationList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Donation[];

    setDonations(donationList);
  };

  return (
    <div className="space-y-8">
      {/* Create Campaign */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Create Donation Campaign</h2>

        <div className="grid gap-4">
          <input
            className="border rounded-xl p-3"
            placeholder="Campaign Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="border rounded-xl p-3"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  }}
/>

          <input
            className="border rounded-xl p-3"
            placeholder="Goal Amount"
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
          />

          <input
            className="border rounded-xl p-3"
            placeholder="Time Left (example: 12 days left)"
            value={timeLeft}
            onChange={(e) => setTimeLeft(e.target.value)}
          />

          <button
            onClick={createCampaign}
            className="bg-orange-500 text-white py-3 rounded-xl font-bold"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* Total Donation Stats */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-2">Donation Overview</h2>
        <p className="text-3xl font-black text-green-600">
          ₹{totalRaised.toLocaleString()}
        </p>
        <p className="text-sm text-slate-500">Total Donations Raised</p>
      </div>

      {/* Campaign List */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">All Campaigns</h2>

        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold">{campaign.title}</h3>
                <p className="text-sm text-slate-500">
                  ₹{campaign.raisedAmount} / ₹{campaign.goalAmount}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => loadDonations(campaign.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  View Donors
                </button>

                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Donor List */}
      {selectedCampaign && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Donor Details</h2>

          <div className="space-y-3">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="border rounded-xl p-4 flex justify-between"
              >
                <div>
                  <p className="font-bold">{donation.donorName}</p>
<p className="text-sm text-slate-500">{donation.donorEmail}</p>
<p className="text-sm text-slate-500">{donation.donorPhone}</p>
                  <p className="text-sm text-slate-500">
                    Payment ID: {donation.paymentId}
                  </p>
                </div>

                <div className="font-bold text-green-600">
                  ₹{donation.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}