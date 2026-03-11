const PROXY_URL = "/api_1";

export const API_ROUTES = {
  PAPER: {
    GET_ALL: `${PROXY_URL}/papers/list`,
    GET_BY_SN: (sn: string) => `${PROXY_URL}/papers/${sn}`,
  },
};
