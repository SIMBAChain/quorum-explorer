import type { NextApiRequest, NextApiResponse } from "next";
import { ethApiCall } from "../../common/lib/ethApiCall";
import { ConsensusAlgorithms, Clients } from "../../common/types/Validator";
import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.body);
  const client = req.body.client;
  const algorithm = req.body.algorithm;
  const rpcUrl = req.body.rpcUrl;
  let status = { error: 1, validators: [] };
  const methodDict: Clients = {
    goquorum: {
      qbft: "istanbul_getValidators",
      ibft: "istanbul_getValidators",
      raft: "", // No pending should go through basically instantly
    },
    besu: {
      qbft: "qbft_getValidatorsByBlockNumber",
      ibft: "ibft_getValidatorsByBlockNumber",
      clique: "clique_getSigners",
    },
  };

  const session = await getSession({ req });
  if (!session) {
    /// Not Signed in
    res.status(401).end();
    return;
  }

  try {
    const res = await ethApiCall(
      rpcUrl,
      methodDict[client as keyof Clients][
        algorithm as keyof ConsensusAlgorithms
      ]!,
      ["latest"]
    );
    status = { error: res.status, validators: res.data.result };
  } catch (e) {
    console.error(e);
    console.error(
      "Node is unreachable. Ensure ports are open and client is running!"
    );
  } finally {
    res.status(200).json(status);
    res.end();
  }
}
