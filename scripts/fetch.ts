import { writeFile, rm, mkdir } from 'fs/promises';
import axios from 'axios';

interface TokenListMeta {
  id: string;
  url: string;
}

interface TokenList {
  name: string;
  tokens: Token[];
}

interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

const chains: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon',
}

const lists: Record<number, TokenListMeta[]> = {
  1: [{
    id: 'coingecko',
    url: 'https://tokens.coingecko.com/uniswap/all.json',
  }, {
    id: 'kleros',
    url: 'https://t2crtokens.eth.link/',
  }, {
    id: 'mycrypto',
    url: 'https://uniswap.mycryptoapi.com/',
  }, {
    id: 'zapper',
    url: 'https://zapper.fi/api/token-list',
  }, {
    id: 'zerion',
    url: 'https://tokenlist.zerion.eth.link/',
  }],
  137: [{
    id: 'coingecko',
    url: 'https://tokens.coingecko.com/polygon-pos/all.json',
  }, {
    id: 'quickswap',
    url: 'https://unpkg.com/quickswap-default-token-list/build/quickswap-default.tokenlist.json',
  }, {
    id: 'balancer',
    url: 'https://storageapi.fleek.co/tomafrench-team-bucket/polygon.listed.tokenlist.json',
  }],
};

const LIST_DIR = 'lists';

async function run() {
  const chainIds = Object.keys(lists).map(idString => parseInt(idString));
  const files = [];
  for (const chainId of chainIds) {
    const chainLists = lists[chainId];
    for (const list of chainLists) {
      const { id, url } = list;
      const listData = await getList(url, chainId);
      const chain = chains[chainId];
      const fileName = `${chain}:${id}.json`;
      const filePath = `${LIST_DIR}/${fileName}`;
      files.push({
        id,
        chain: chainId,
        name: fileName,
      });
      if (!listData) {
        continue;
      }
      const listString = JSON.stringify(listData, null, 2);
      await writeFile(filePath, listString);
    }
  }
  const indexString = JSON.stringify(files, null, 2);
  await writeFile(`${LIST_DIR}/index.json`, indexString);
}

async function getList(url: string, chainId: number) {
  let tries = 0;
  while(true) {
    const delay = 1000 * 2 ** tries;
    if (tries > 10) {
      return;
    }
    await sleep(delay);
    tries++;
    try {
      const listResponse = await axios.get(url);
      if (listResponse.status !== 200) {
        continue;
      }
      const fullList = listResponse.data as TokenList;
      const list = {
        ...fullList,
        tokens: fullList.tokens.filter(token => token.chainId === chainId),
      };
      return list;
    } catch(e) {
      continue;
    }
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms, null));
}

run();
