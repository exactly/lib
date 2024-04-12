function [ir_fxd] = fnct_irm_v2_fxd(u_mat, u_float, u_liq, tau, param_float, param_spread)
  % *************************************************************************
  % fnct_irm_v2_xdt: New Interest Rate Model dependent on two variables (pool utilization and liquidity)
  % This fixed rate part is calculated as the basis floating rate times a spread term
  % Current version: 20231214
  % -------------------------------------------------------------------------
  % Input:
  % u_mat             =   specifict maturity utilization ( u_liq=u_float+sum(u_mat) )
  % u_float           =   floating pool utilization
  % u_liq             =   liquidity utilization ( u_liq=u_flp+sum(u_fxp) )
  % tau               =	  time fracton horizon (t_mat/t_max)
  % param_float       =   floating interest rate curve parameters
  %                       param(1) = a
  %                       param(2) = b
  %                       param(3) = umax
  %                       param(4) = u_liq0  - liquidity transition point for rate growth law (also alpha in the code below)
  %                       param(5) = power   - law for liquidity divergence
  %                       param(6) = k       - sigmoid transition speed
  % param_spread      =   spread function parameters
  % *************************************************************************

  [ir_float, sigmd, k_sigmoid, power] = fnct_irm_v2_flt(u_float, u_liq, param_float);

  spread = fnct_irm_v2_spread_z1(u_mat, u_liq, tau, param_spread);

  ir_fxd = ir_float * spread;

  % arg1=a./(umax-u_pool)+b;
  % alpha=u_liq0;                                                                % sigmoid transition point
  % sigmd=1./(1+(((1-u_liq).*alpha)./(u_liq.*(1-alpha))).^k);                    % scaled sigmoid function (in power form)
  %
  % irf_m4=arg1.*(1-0.5*u_liq0).^power./(1-sigmd.*u_liq).^power;
  %
  % irf=[irf_m4];
  % % irf=tril(irf);
  % k_sigmoid=k;

end
