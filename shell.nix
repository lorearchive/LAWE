{ pkgs ? import <nixpkgs> {} }:

    pkgs.mkShell {
        buildInputs = with pkgs; [
            gcc
            cmake
            emscripten            
            clang-tools  # clangd (better than MS IntelliSense)
        ];

        shellHook = ''
            echo "C++ development environment for LAWE loaded!"
            echo "GCC: $(gcc --version | head -n1)"
            echo "CMake: $(cmake --version | head -n1)"
        '';
    }