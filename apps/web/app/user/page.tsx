"use client";

import { useSession } from "next-auth/react";

const UserPage = () => {
  const { data: session } = useSession();
  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const user = await getUser({ email: "ranapavitar14@gmail.com" });

  //     console.log("user : ", user);
  //   };

  //   fetchUser();
  // }, []);
  //

  return (
    <div>
      <div>hi there : {session?.user?.email}</div>
      <div>hi name : {session?.user?.name}</div>
      <div>Id : {session?.user?.id}</div>
    </div>
  );
};

export default UserPage;
