function [irf, sigmd, k_sigmoid, power] = fnct_irm_v2_flt(u_pool, u_liq, param)
  % *************************************************************************
  % fnct_irm_v2_flt: New Interest Rate Model dependent on two variables (pool utilization and liquidity)
  % This version implements M4 -> A model continuous and derivable with transition point given by sigmoid function
  % Current version: 20231106
  % -------------------------------------------------------------------------
  % Input:
  % u_pool =    pool utilization
  % u_liq  =    liquidity utilization ( u_liq=u_flp+sum(u_fxp) )
  % param  =    interest rate curve parameters
  %             param(1) = a
  %             param(2) = b
  %             param(3) = umax
  %             param(4) = u_liq0  - liquidity transition point for rate growth law (also alpha in the code below)
  %             param(5) = power   - law for liquidity divergence
  %             param(6) = k       - sigmoid transition speed

  % *************************************************************************

  a = param(1);
  b = param(2);
  umax = param(3);
  u_liq0 = param(4);
  power = param(5); % power law for liquidity divergence
  k = param(6); % sigmoid transition speed

  arg1 = a ./ (umax - u_pool) + b;
  alpha = u_liq0; % sigmoid transition point
  sigmd = 1 ./ (1 + (((1 - u_liq) .* alpha) ./ (u_liq .* (1 - alpha))) .^ k); % scaled sigmoid function (in power form)

  % irf_m4=arg1.*(1-0.5*u_liq0).^power./(1-sigmd.*u_liq).^power;
  irf_m4 = arg1 ./ (1 - sigmd .* u_liq) .^ power;

  irf = [irf_m4];
  % irf=tril(irf);
  k_sigmoid = k;
end
