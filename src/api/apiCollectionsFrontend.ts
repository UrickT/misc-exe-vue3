const PROXY_URL = "/api_1";

export const API_ROUTES = {
  PAPER: {
    GET_ALL: `${PROXY_URL}/papers/list`,
    GET_BY_SN: (sn: number) => `${PROXY_URL}/papers/${sn}`,
  },
  UPLOADED_FILE: {
    GET_ALL: `${PROXY_URL}/uploaded-files/list`,
    GET_BY_SN: (sn: number) => `${PROXY_URL}/uploaded-files/${sn}`,
    UPLOAD: `${PROXY_URL}/uploaded-files/upload`,
    DELETE_BY_SN: (sn: number) => `${PROXY_URL}/uploaded-files/${sn}`,
  },
};
