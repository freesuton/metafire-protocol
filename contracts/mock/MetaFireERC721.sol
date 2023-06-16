// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title MintableERC721
 * @dev ERC721 minting logic
 */
contract MewERC721 is ERC721Enumerable {
  string public baseURI;
  mapping(address => uint256) public mintCounts;
  uint256 public tokenCount;
  uint256 private tokenCap = 5000;
  mapping (uint256 => string) private _tokenURIs;
  constructor(string memory name, string memory symbol, string memory _baseUri) ERC721(name, symbol) {
    baseURI = _baseUri;
  }

    /**
    * @dev Function to mint tokens
    * @return A boolean that indicates if the operation was successful.
    */
    function mint() public payable returns (bool) {
        require(msg.value >= 0.01 ether, "Insufficient ETH");
        require(tokenCount <= tokenCap, "exceed mint limit");

        mintCounts[_msgSender()] += 1;
        require(mintCounts[_msgSender()] <= 10, "exceed mint limit");
        tokenCount += 1;
        _mint(_msgSender(), tokenCount);
        _setTokenURI(tokenCount);

        return true; 
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory baseURI_) public {
        baseURI = baseURI_;
    }

    function _setTokenURI(uint256 tokenId) internal virtual {
        _tokenURIs[tokenId] = _baseURI();
    }
}