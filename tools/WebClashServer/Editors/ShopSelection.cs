﻿using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using WebClashServer.Classes;

namespace WebClashServer.Editors
{
    public partial class ShopSelection : Form
    {
        //private List<ShopItem> items = new List<ShopItem>();
        private ShowShopEvent sse = new ShowShopEvent();
        private int current = -1;

        public ShopSelection(string title, ShowShopEvent sse)
        {
            InitializeComponent();

            Text = title;

            this.sse = sse;

            shopName.Text = sse.name;
        }

        private void ItemSelection_Load(object sender, EventArgs e)
        {
            Reloaditems();

            ReloadItemList(sse.items);
        }

        private void ReloadItemList(ShopItem[] items)
        {
            itemList.Items.Clear();

            try
            {
                for (int i = 0; i < items.Length; i++)
                {
                    string it = items[i].item;

                    itemList.Items.Add(i + ". " + items[i].item + " (" + items[i].price + "G)");
                }
            }
            catch (Exception exc)
            {
                MessageBox.Show(exc.Message, "WebClash Server - Error");
            }

            if (current == -1 &&
                items.Length > 0)
                itemList.SelectedItem = itemList.Items[0];
            else if (items.Length > 0 &&
                     current < sse.items.Length)
                itemList.SelectedItem = itemList.Items[current];
        }

        private void Reloaditems()
        {
            itemSelect.Items.Clear();

            try
            {
                List<string> ext = new List<string>()
                {
                    ".json"
                };

                string[] items = Directory.GetFiles(Program.main.location + "/items", "*.*", SearchOption.AllDirectories)
                    .Where(s => ext.Contains(Path.GetExtension(s))).ToArray();

                foreach (string i in items)
                    itemSelect.Items.Add(i.Substring(i.LastIndexOf('\\') + 1, i.LastIndexOf('.') - i.LastIndexOf('\\') - 1));
            }
            catch (Exception exc)
            {
                MessageBox.Show(exc.Message, "WebClash Server - Error");
            }
        }

        private void itemList_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (itemList.SelectedIndex == -1 ||
                sse.items.Length <= itemList.SelectedIndex)
                return;

            current = itemList.SelectedIndex;

            itemSelect.SelectedItem = sse.items[current].item;
            itemPrice.Value = sse.items[current].price;
        }

        private void itemSelect_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (current == -1)
                return;

            sse.items[current].item = itemSelect.SelectedItem.ToString();

            ReloadItemList(sse.items.ToArray());
        }

        private void price_ValueChanged(object sender, EventArgs e)
        {
            if (current == -1)
                return;

            sse.items[current].price = (int)itemPrice.Value;

            ReloadItemList(sse.items);
        }

        private void newLink_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            string i = itemList.Items.Count + ". " + string.Empty;

            List<ShopItem> items = new List<ShopItem>(sse.items);

            items.Add(new ShopItem());

            sse.items = items.ToArray();

            itemList.Items.Add(i);
            itemList.SelectedItem = i;
        }

        private void delete_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            if (current == -1)
                return;

            List<ShopItem> items = new List<ShopItem>(sse.items);

            items.RemoveAt(current);

            sse.items = items.ToArray();

            ReloadItemList(sse.items.ToArray());
        }

        private void ShopName_TextChanged(object sender, EventArgs e)
        {
            sse.name = shopName.Text;
        }

        public ShowShopEvent GetResult()
        {
            return sse;
        }
    }

    public class ShopItem
    {
        public string item = "";
        public int price = 1;
    }
}