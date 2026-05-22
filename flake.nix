{
  description = "Development shell for the World Cup Dashboard";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              python312
              uv

              postgresql
              libpq
              pkg-config

              docker-client
              docker-compose
            ];

            env = {
              UV_PROJECT_ENVIRONMENT = ".venv";
            };

            shellHook = ''
              export PROJECT_ROOT="$PWD"
              export BACKEND_DIR="$PROJECT_ROOT/backend"
              export AIRFLOW_HOME="$BACKEND_DIR/airflow"
              export PYTHONPATH="$BACKEND_DIR''${PYTHONPATH:+:$PYTHONPATH}"

              echo "World Cup Dashboard dev shell"
              echo "  Setup:  cd backend && uv venv && uv pip install -r requirements.txt"
              echo "  API:    cd backend && ./scripts/startup.sh"
              echo "  Docker: cd backend && docker compose up -d"
            '';
          };
        }
      );
    };
}
