function [spread] = fnct_irm_v2_spread_z1(u_mat, u_liq, tau, param)
  % *************************************************************************
  % fnct_irm_v2_spread_z1 gives the fixed rate spread over the float rate value
  % in this version the Z function is given by: Z1(x)=A*x^0.5+B*x+C
  % Current version: 20231214
  % -------------------------------------------------------------------------
  % Input:
  % u_mat     = specifict maturity utilization ( u_liq=u_float+sum(u_mat) )
  % u_liq     = liquidity utilization ( u_liq=u_flp+sum(u_fxp) )
  % tau       = time fracton horizon (t_mat/t_max)
  % param     = spread rate curve parameters
  %             param(1)=a1
  %             param(2)=a0
  %             param(3)=eta_pwr
  %             param(4)=n_mat
  %             param(5)=nu_fact
  %
  % Outut:
  % spread	= spread value
  %
  % *************************************************************************
  a1 = param(1);
  a0 = param(2);
  etha_pwr = param(3);
  n_mat = param(4);
  nu_fact = param(5);

  n_utfxd = size(u_mat, 2);
  u_fxd_nat = (1 - nu_fact) * u_liq / n_mat;
  alpha = sqrt(n_mat / (1 - nu_fact));

  A = (2 - alpha ^ 2) / (alpha * (1 - alpha));
  B = 1 - A;
  C = -1;

  arg = u_mat ./ u_fxd_nat;
  Z1 = A * sqrt(arg) + B * arg + C;

  spread = (1 + tau .^ etha_pwr .* (a1 + a0 .* Z1));

end
