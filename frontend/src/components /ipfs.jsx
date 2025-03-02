import { create } from 'ipfs-http-client';
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
export const uploadToIPFS = async (file) => {
    const added = await ipfs.add(file);
    return `https://ipfs.infura.io/ipfs/${added.path}`;
};
