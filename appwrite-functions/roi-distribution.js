
const sdk = require('node-appwrite');

module.exports = async (req, res) => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const dbId = process.env.DATABASE_ID;
  const walletCol = process.env.WALLETS_COLLECTION_ID;
  const poolCol = process.env.POOLS_COLLECTION_ID;
  const txCol = process.env.TRANSACTIONS_COLLECTION_ID;

  try {
    const wallets = await databases.listDocuments(dbId, walletCol);

    for (const wallet of wallets.documents) {
      let totalROI = 0;
      
      // 0.20% Daily Wallet ROI
      const walletROI = wallet.balance * 0.002;
      totalROI += walletROI;

      // 0.50% Daily Pool ROI (if in Pool 1)
      const pools = await databases.listDocuments(dbId, poolCol, [
        sdk.Query.equal('user_id', wallet.user_id),
        sdk.Query.equal('pool_number', 1),
        sdk.Query.equal('status', 'active')
      ]);

      if (pools.total > 0) {
        totalROI += (10 * 0.005);
      }

      if (totalROI > 0) {
        await databases.updateDocument(dbId, walletCol, wallet.$id, {
          balance: wallet.balance + totalROI,
          total_earned: wallet.total_earned + totalROI,
          roi_earned: (wallet.roi_earned || 0) + totalROI,
          last_roi_at: new Date().toISOString()
        });

        await databases.createDocument(dbId, txCol, 'unique()', {
          user_id: wallet.user_id,
          type: 'roi',
          amount: totalROI,
          status: 'completed'
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
