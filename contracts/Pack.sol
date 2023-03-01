// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
import "./Gear.sol";


contract Pack is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    GearInterface _gearContract;

    constructor(address gearContractAddress) ERC721("Pack", "PACK") {
        _gearContract = GearInterface(gearContractAddress);
    }

    function mintPack(address user, string memory tokenURI) onlyOwner public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(user, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function burnPack(uint256 tokenId)  public nonReentrant {
        address ownerOfPack = _ownerOf(tokenId);
        address ownerOfContract = owner();
        require((_msgSender() == ownerOfPack || _msgSender() == ownerOfContract), "ERC721Burnable: caller is not owner nor approved");
        _gearContract.mintGear(ownerOfPack, "https://some.gear");
        _burn(tokenId);
    }
}
