
const sdk = require('node-appwrite');

module.exports = async (req, res) => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const dbId = process.env.DATABASE_ID;
  const userCol = process.env.USERS_COLLECTION_ID;
  const walletCol = process.env.WALLETS_COLLECTION_ID;
  const txCol = process.env.TRANSACTIONS_COLLECTION_ID;

  const { userId, amount } = JSON.parse(req.payload);

  try {
    const user = await databases.getDocument(dbId, userCol, userId);
    const wallet = await databases.listDocuments(dbId, walletCol, [sdk.Query.equal('user_id', userId)]);
    
    if (user.is_active) {
      // Just add balance
      await databases.updateDocument(dbId, walletCol, wallet.documents[0].$id, {
        balance: wallet.documents[0].balance + amount
      });
    } else if (amount >= 10) {
      // ACTIVATE USER
      await databases.updateDocument(dbId, userCol, userId, { is_active: true });
      
      const remaining = amount - 10;
      await databases.updateDocument(dbId, walletCol, wallet.documents[0].$id, {
        balance: wallet.documents[0].balance + remaining
      });

      // 1. Matrix Placement Logic (Simplified for Server)
      // 2. Direct Commission ($5)
      if (user.sponsor_id) {
        const sponsorWallet = await databases.listDocuments(dbId, walletCol, [sdk.Query.equal('user_id', user.sponsor_id)]);
        if (sponsorWallet.total > 0) {
          await databases.updateDocument(dbId, walletCol, sponsorWallet.documents[0].$id, {
            balance: sponsorWallet.documents[0].balance + 5,
            total_earned: sponsorWallet.documents[0].total_earned + 5
          });
          // Log Direct Income
          await databases.createDocument(dbId, txCol, 'unique()', {
            user_id: user.sponsor_id,
            from_user_id: userId,
            type: 'direct',
            amount: 5,
            status: 'completed'
          });
        }
      }
      
      // 3. Level Income ($0.50 x 6 Levels)
      // (Logic to traverse matrix parents and pay $0.50)
    }

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
