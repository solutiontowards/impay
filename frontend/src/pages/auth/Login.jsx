import React from "react";
import LoginComponents from "../../components/Home/LoginComponents";

const Login = () => {
  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT IMAGE SECTION */}
      <div className="hidden lg:flex w-2/3 relative">
        <img
          src="https://picsum.photos/1200/900?random=0.6130993237541995" // place image in public folder
          alt="Login Visual"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Optional overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* RIGHT LOGIN FORM SECTION */}
      <div className="w-full lg:w-1/3 flex items-center justify-center px-6 md:px-12">
        <div className="w-full ">
          <LoginComponents />
        </div>
      </div>
    </div>
  );
};

export default Login;
