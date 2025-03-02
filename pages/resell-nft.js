import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';

import { NFTContext } from '../context/NFTContext';
import { Button, Input, Loader } from '../components';

const ResellNFT = () => {
  const { createSale, isLoadingNFT } = useContext(NFTContext);
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const router = useRouter();
  const { id, tokenURI } = router.query;

  const fetchNFT = async () => {
    if (!tokenURI) return;

    const { data } = await axios.get(tokenURI);

    setImage(data.image);
  };

  useEffect(() => {
    fetchNFT();
  }, [id, tokenURI]);

  const resell = async () => {
    await createSale(tokenURI, price, true, id);

    router.push('/');
  };

  if (isLoadingNFT) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-3/5 md:w-full">
        <h1 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl">Resell NFT</h1>

        <Input
          inputType="number"
          title="Price"
          placeholder="NFT Price"
          handleChange={(e) => setPrice(e.target.value)}
        />

        {image && (
          <div className="mt-10">
            <img
              src={image}
              className="rounded-xl"
              width={350}
            />
          </div>
        )}

        <div className="mt-7 w-full flex justify-end">
          <Button
            btnName="List NFT"
            btnType="primary"
            classStyles="rounded-xl"
            handleClick={resell}
          />
        </div>
      </div>
    </div>
  );
};

export default ResellNFT;
