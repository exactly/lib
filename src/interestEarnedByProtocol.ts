import request from 'graphql-request';

type OperationReponse = {
  assets: string;
  timestamp: number;
};

type TreasurySetResponse = {
  treasuryFeeRate: string
  timestamp: number
};

type Response = {
  deposits: OperationReponse[],
  borrows: OperationReponse[],
  treasurySets: TreasurySetResponse[]
};

export default async (subgraph: string, market: string) => {
  const { deposits: depositResponse, borrows: borrowsResponse, treasurySets: treasurySetResponse } = await request<Response>(subgraph, `{
    deposits(where: {market: "${market}"}) {
      assets
      timestamp
    }
    borrows(where: {market: "${market}"}) {
      assets
      timestamp
    }
    treasurySets(where: {market: "${market}"}, orderBy: timestamp, orderDirection: desc){
      timestamp
      treasuryFeeRate
    }
  }`);

  const deposits = depositResponse.map(({ assets, timestamp }) => (
    { assets: BigInt(assets), timestamp }));

  const borrows = borrowsResponse.map(({ assets, timestamp }) => (
    { assets: BigInt(assets), timestamp }));

  const treasurySets = treasurySetResponse.map(({ treasuryFeeRate, timestamp }) => (
    { treasuryFeeRate: BigInt(treasuryFeeRate), timestamp }));

  const depositFee = deposits.reduce((acc, { assets, timestamp }) => {
    const feeRate = treasurySets.find(({ timestamp: ts }) => ts <= timestamp)
      ?.treasuryFeeRate ?? 0n;
    return acc + (assets * feeRate);
  }, 0n);

  const borrowFee = borrows.reduce(
    (acc, { assets, timestamp }) => {
      const feeRate = treasurySets.find(({ timestamp: ts }) => ts <= timestamp)
        ?.treasuryFeeRate ?? 0n;
      return acc + (assets * feeRate);
    },
    0n,
  );

  return depositFee + borrowFee;
};
